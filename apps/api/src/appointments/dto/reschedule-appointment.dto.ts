import { IsISO8601, IsOptional, IsString } from 'class-validator';

export class RescheduleAppointmentDto {
  @IsISO8601()
  date!: string;

  @IsOptional()
  @IsString()
  doctorId?: string;
}
