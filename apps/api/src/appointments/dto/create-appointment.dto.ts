import { IsIn, IsInt, IsISO8601, IsOptional, IsString, Min } from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  patientId!: string;

  @IsString()
  doctorId!: string;

  @IsISO8601()
  date!: string;

  @IsOptional()
  @IsIn(['WALK_IN', 'CONSULTATION'])
  type?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  registrationFee?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  amountPaid?: number;

  @IsOptional()
  @IsString()
  reasonForVisit?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
