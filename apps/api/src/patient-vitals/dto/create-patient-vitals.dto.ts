import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePatientVitalsDto {
  @IsString()
  patientId!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  heightCm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  weightKg?: number;

  // BMI is auto-calculated from height and weight — not accepted from client

  @IsOptional()
  @IsNumber()
  @Min(30)
  @Max(50)
  temperatureC?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  pulseBpm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(300)
  systolicBp?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(200)
  diastolicBp?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  spo2Percent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  respiratoryRate?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  recordedAt?: Date;
}
