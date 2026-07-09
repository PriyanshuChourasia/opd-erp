import { IsIn } from 'class-validator';

export class UpdateAppointmentStatusDto {
  @IsIn(['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'])
  status!: string;
}
