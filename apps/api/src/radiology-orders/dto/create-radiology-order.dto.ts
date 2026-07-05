import { IsOptional, IsString } from 'class-validator';

export class CreateRadiologyOrderDto {
  @IsString()
  patientId!: string;

  @IsString()
  doctorId!: string;

  @IsString()
  studyName!: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
