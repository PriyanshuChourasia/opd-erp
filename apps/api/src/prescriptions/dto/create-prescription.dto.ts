import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';

export class PrescriptionItemDto {
  @IsString()
  medicineId!: string;

  @IsString()
  medicineName!: string;

  @IsString()
  dosage!: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  quantity!: number;

  @IsOptional()
  refills?: number;
}

export class CreatePrescriptionDto {
  @IsString()
  patientId!: string;

  @IsString()
  doctorId!: string;

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PrescriptionItemDto)
  @MinLength(1, { message: 'At least one prescription item is required' })
  items!: PrescriptionItemDto[];
}
