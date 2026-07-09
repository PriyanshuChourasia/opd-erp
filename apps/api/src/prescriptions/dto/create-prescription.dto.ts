import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

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

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
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
  @ArrayMinSize(1, { message: 'At least one prescription item is required' })
  items!: PrescriptionItemDto[];
}
