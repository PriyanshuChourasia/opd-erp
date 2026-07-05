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
 * Generates available appointment time slots from a doctor's schedule
 * and booked appointments.
 *
 * # SOLID
 * - **Single Responsibility** — this is the only class that knows how to generate slots.
 * - **Dependency Inversion** — depends on PrismaService abstraction, not concrete DB logic.
 */
@Injectable()
export class SlotGeneratorService {
  constructor(private readonly prisma: PrismaService) {}

  async generateSlots(doctorId: string, dateStr: string): Promise<SlotResult> {
    const date = startOfDay(new Date(dateStr));
    const dayOfWeek = date.getDay();

    const schedule = await this.prisma.doctorSchedule.findUnique({
      where: { doctorId_dayOfWeek: { doctorId, dayOfWeek } },
    });

    if (!schedule) {
      return { available: false, slots: [] };
    }

    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        doctorId,
        date: { gte: date, lt: nextDay },
        status: { not: 'CANCELLED' },
      },
      select: { date: true },
    });

    const bookedCounts = new Map<string, number>();
    for (const appt of appointments) {
      const time = `${appt.date.getHours().toString().padStart(2, '0')}:${appt.date
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;
      bookedCounts.set(time, (bookedCounts.get(time) ?? 0) + 1);
    }

    const slots: TimeSlot[] = [];
    const start = timeToMinutes(schedule.startTime);
    const end = timeToMinutes(schedule.endTime);
    for (let minutes = start; minutes < end; minutes += schedule.slotDuration) {
      const time = minutesToTime(minutes);
      const booked = bookedCounts.get(time) ?? 0;
      slots.push({ time, capacity: schedule.maxPatients, booked, available: booked < schedule.maxPatients });
    }

    return { available: true, slots };
  }
}
