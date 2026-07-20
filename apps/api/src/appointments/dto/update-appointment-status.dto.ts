import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateAppointmentStatusDto {
  @IsIn(['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW'])
  status!: string;

  /** Only persisted when status is CANCELLED. */
  @IsOptional()
  @IsString()
  cancellationReason?: string;
}
