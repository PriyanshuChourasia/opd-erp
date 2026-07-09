import { IsString } from 'class-validator';

export class CreateQueueEntryDto {
  @IsString()
  patientId!: string;

  @IsString()
  doctorId!: string;
}
