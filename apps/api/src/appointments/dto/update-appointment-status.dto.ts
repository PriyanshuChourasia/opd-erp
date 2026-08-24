import { IsIn, IsOptional, IsString, ValidateIf } from 'class-validator';

export class UpdateAppointmentStatusDto {
  @IsIn(['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW'])
  status!: string;

  /** Required when status is CANCELLED. */
  @ValidateIf((o) => o.status === 'CANCELLED')
  @IsString()
  cancellationReason?: string;
}
