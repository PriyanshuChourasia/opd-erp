import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface TimeSlot {
  time: string;
  capacity: number;
  booked: number;
  available: boolean;
}

export interface SlotResult {
  available: boolean;
  slots: TimeSlot[];
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':');
  return Number(hours) * 60 + Number(minutes);
}

function minutesToTime(total: number): string {
  const hours = Math.floor(total / 60)
    .toString()
    .padStart(2, '0');
  const minutes = (total % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Generates available appointment time slots from an employee's schedule
 * and booked appointments.
 *
 * Uses EmployeeSchedule (generic) with configurable slot duration and max patients.
 *
 * # SOLID
 * - **Single Responsibility** — this is the only class that knows how to generate slots.
 * - **Dependency Inversion** — depends on PrismaService abstraction, not concrete DB logic.
 */
@Injectable()
export class SlotGeneratorService {
  constructor(private readonly prisma: PrismaService) {}

  async generateSlots(
    employeeSchedulableType: string,
    employeeSchedulableId: string,
    dateStr: string,
    options?: { slotDuration?: number; maxPatients?: number },
  ): Promise<SlotResult> {
    const date = startOfDay(new Date(dateStr));
    // Convert JS getDay() (0=Sunday) to DayOfWeek (0=Monday)
    const dayOfWeek = (date.getDay() + 6) % 7;

    const schedule = await this.prisma.employeeSchedule.findFirst({
      where: {
        employeeSchedulableType,
        employeeSchedulableId,
        dayOfWeek,
      },
    });

    if (!schedule) {
      return { available: false, slots: [] };
    }

    const slotDuration = options?.slotDuration ?? 15;
    const maxPatients = options?.maxPatients ?? 20;

    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    // Query appointments for the doctor (when employee type is Doctor)
    let bookedAppointments: { date: Date }[] = [];
    if (employeeSchedulableType === 'Doctor') {
      bookedAppointments = await this.prisma.appointment.findMany({
        where: {
          doctorId: employeeSchedulableId,
          date: { gte: date, lt: nextDay },
          status: { not: 'CANCELLED' },
        },
        select: { date: true },
      });
    }

    const bookedCounts = new Map<string, number>();
    for (const appt of bookedAppointments) {
      const time = `${appt.date.getHours().toString().padStart(2, '0')}:${appt.date
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;
      bookedCounts.set(time, (bookedCounts.get(time) ?? 0) + 1);
    }

    const slots: TimeSlot[] = [];
    const start = timeToMinutes(schedule.startTime);
    const end = timeToMinutes(schedule.endTime);
    for (let minutes = start; minutes < end; minutes += slotDuration) {
      const time = minutesToTime(minutes);
      const booked = bookedCounts.get(time) ?? 0;
      slots.push({ time, capacity: maxPatients, booked, available: booked < maxPatients });
    }

    return { available: true, slots };
  }
}
