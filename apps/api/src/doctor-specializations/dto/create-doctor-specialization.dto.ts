import { IsString } from 'class-validator';

export class CreateDoctorSpecializationDto {
  @IsString()
  doctorId!: string;

  @IsString()
  specializationId!: string;
}
