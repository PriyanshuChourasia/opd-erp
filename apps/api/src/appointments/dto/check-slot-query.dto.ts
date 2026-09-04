import { IsOptional, IsString, Matches } from 'class-validator';

/**
 * Single-point availability check for one doctor + date + time.
 * Unlike grid-based slot generation, this validates an arbitrary
 * manually-entered time (e.g. "09:37") that need not fall on a slot boundary.
 */
export class CheckSlotQueryDto {
  @IsString()
  doctorId!: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be in YYYY-MM-DD format' })
  date!: string;

  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'time must be in 24h HH:mm format' })
  time!: string;

  /** When editing an appointment, exclude it so it is not reported as "already booked". */
  @IsOptional()
  @IsString()
  excludeAppointmentId?: string;
}
