import { IsIn, IsInt, IsISO8601, IsOptional, IsString, Min } from 'class-validator';

export class UpdateAppointmentDto {
  @IsOptional()
  @IsISO8601()
  date?: string;

  @IsOptional()
  @IsString()
  doctorId?: string;

  @IsOptional()
  @IsIn(['WALK_IN', 'CONSULTATION', 'SPECIALIST', 'EMERGENCY', 'FOLLOW_UP', 'TELECONSULTATION'])
  type?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  fee?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  registrationFee?: number;

  @IsOptional()
  @IsString()
  reasonForVisit?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsIn(['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', 'NO_SHOW'])
  status?: string;

  @IsOptional()
  @IsString()
  cancellationReason?: string;
}
