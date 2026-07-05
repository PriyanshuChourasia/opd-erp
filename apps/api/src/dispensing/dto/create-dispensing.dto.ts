import { IsOptional, IsString, IsInt, Min } from 'class-validator';

export class CreateDispensingDto {
  @IsString()
  prescriptionId!: string;

  @IsString()
  medicineId!: string;

  @IsString()
  medicineName!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsString()
  batchNo?: string;

  @IsOptional()
  @IsString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  dispensedBy?: string;
}
