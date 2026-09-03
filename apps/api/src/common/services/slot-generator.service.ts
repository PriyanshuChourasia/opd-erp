import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { EmployeeScheduleExceptionType } from '@prisma/client';

export interface TimeSlot {
  time: string;
  capacity: number;
  booked: number;
  available: boolean;
  patients?: string[];
  /** Which shift/window produced this slot (recurring schedule or exception). */
  shiftId?: string | null;
  shiftName?: string | null;
  windowStart: string;
  windowEnd: string;
  /** True when the slot comes from a one-off EmployeeScheduleException. */
  isException: boolean;
  exceptionType?: EmployeeScheduleExceptionType | null;
}

/** A resolved working window for a requested date (recurring or one-off). */
export interface SlotWindow {
  windowStart: string;
  windowEnd: string;
  shiftId?: string | null;
  shiftName?: string | null;
  isException: boolean;
  exceptionType?: EmployeeScheduleExceptionType | null;
  /** Human label: shift name when present, else the time range. */
  label: string;
}

export interface SlotResult {
  available: boolean;
  slots: TimeSlot[];
  windows: SlotWindow[];
  /** True when a DAY_OFF exception suppresses this date entirely. */
  dayOff?: boolean;
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

interface ScheduleWindowSource {
  startTime: string;
  endTime: string;
  shiftId: string | null;
  shiftName: string | null;
  isException: boolean;
  exceptionType: EmployeeScheduleExceptionType | null;
}

/**
 * Generates available appointment time slots from an employee's schedule and
 * booked appointments.
 *
 * Resolution order for a requested calendar date:
 *  1. EmployeeScheduleException rows for that exact date (DAY_OFF / OVERRIDE /
 *     EXTRA_SHIFT).
 *  2. DAY_OFF present  → no availability at all that date.
 *  3. OVERRIDE present → those windows REPLACE the recurring weekly windows.
 *  4. EXTRA_SHIFT rows → layered ON TOP of the recurring weekly windows (the
 *     "extra shift just on this one date" case). Each slot is tagged with the
 *     window (and shift) it came from, and exception-sourced slots carry
 *     isException: true so the UI can label them distinctly.
 *  5. No exceptions   → recurring weekly EmployeeSchedule rows for the
 *     date's day-of-week.
 *
 * An employee can have multiple recurring rows on the same day (two shifts),
 * so every matching row is used — NOT just the first one.
 *
 * Uses EmployeeSchedule (generic) with configurable slot duration and max
 * patients.
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

    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    // 1. One-off exceptions for the exact requested date
    const exceptions = await this.prisma.employeeScheduleException.findMany({
      where: {
        employeeSchedulableType,
        employeeSchedulableId,
        date: { gte: date, lt: nextDay },
        deletedAt: null,
      },
      orderBy: [{ startTime: 'asc' }, { id: 'asc' }],
      include: { shift: true },
    });

    // 2. DAY_OFF wins over everything
    if (exceptions.some((e) => e.type === 'DAY_OFF')) {
      return { available: false, slots: [], windows: [], dayOff: true };
    }

    const overrideRows = exceptions.filter((e) => e.type === 'OVERRIDE');
    const extraRows = exceptions.filter((e) => e.type === 'EXTRA_SHIFT');

    // 3/4/5. Resolve the windows that apply to this date
    let sources: ScheduleWindowSource[];
    if (overrideRows.length > 0) {
      sources = overrideRows.map((e) => ({
        startTime: e.startTime,
        endTime: e.endTime,
        shiftId: e.shiftId,
        shiftName: e.shift?.name ?? null,
        isException: true,
        exceptionType: e.type as EmployeeScheduleExceptionType,
      }));
    } else {
      const recurring = await this.prisma.employeeSchedule.findMany({
        where: {
          employeeSchedulableType,
          employeeSchedulableId,
          dayOfWeek,
        },
        orderBy: [{ startTime: 'asc' }, { id: 'asc' }],
        include: { shift: true },
      });

      sources = [
        ...recurring.map((s) => ({
          startTime: s.startTime,
          endTime: s.endTime,
          shiftId: s.shiftId,
          shiftName: s.shift?.name ?? null,
          isException: false,
          exceptionType: null as EmployeeScheduleExceptionType | null,
        })),
        ...extraRows.map((e) => ({
          startTime: e.startTime,
          endTime: e.endTime,
          shiftId: e.shiftId,
          shiftName: e.shift?.name ?? null,
          isException: true,
          exceptionType: e.type as EmployeeScheduleExceptionType,
        })),
      ].sort((a, b) => a.startTime.localeCompare(b.startTime) || a.endTime.localeCompare(b.endTime));
    }

    if (sources.length === 0) {
      return { available: false, slots: [], windows: [] };
    }

    const windows: SlotWindow[] = sources.map((s) => ({
      windowStart: s.startTime,
      windowEnd: s.endTime,
      shiftId: s.shiftId,
      shiftName: s.shiftName,
      isException: s.isException,
      exceptionType: s.exceptionType,
      label: s.shiftName ?? `${s.startTime}–${s.endTime}`,
    }));

    const slotDuration = options?.slotDuration ?? 15;
    const maxPatients = options?.maxPatients ?? 20;

    // Query appointments for the doctor (when employee type is Doctor)
    let bookedAppointments: { date: Date; patient?: { firstName: string; lastName: string } | null }[] = [];
    if (employeeSchedulableType === 'Doctor') {
      bookedAppointments = await this.prisma.appointment.findMany({
        where: {
          doctorId: employeeSchedulableId,
          date: { gte: date, lt: nextDay },
          status: { not: 'CANCELLED' },
          deletedAt: null,
        },
        select: { date: true, patient: { select: { firstName: true, lastName: true } } },
      });
    }

    const bookedByTime = new Map<string, { count: number; patients: string[] }>();
    for (const appt of bookedAppointments) {
      const time = `${appt.date.getHours().toString().padStart(2, '0')}:${appt.date
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;
      const entry = bookedByTime.get(time) ?? { count: 0, patients: [] };
      entry.count++;
      if (appt.patient) entry.patients.push(`${appt.patient.firstName} ${appt.patient.lastName}`);
      bookedByTime.set(time, entry);
    }

    // Skip past slots when generating for today — a slot earlier than now can't be booked.
    const now = new Date();
    const isToday = startOfDay(now).getTime() === date.getTime();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const slots: TimeSlot[] = [];
    for (const source of sources) {
      const start = timeToMinutes(source.startTime);
      const end = timeToMinutes(source.endTime);
      for (let minutes = start; minutes < end; minutes += slotDuration) {
        if (isToday && minutes <= nowMinutes) continue;
        const time = minutesToTime(minutes);
        const entry = bookedByTime.get(time);
        const booked = entry?.count ?? 0;
        slots.push({
          time,
          capacity: maxPatients,
          booked,
          available: booked < maxPatients,
          patients: entry?.patients,
          shiftId: source.shiftId,
          shiftName: source.shiftName,
          windowStart: source.startTime,
          windowEnd: source.endTime,
          isException: source.isException,
          exceptionType: source.exceptionType,
        });
      }
    }

    return { available: true, slots, windows };
  }
}
