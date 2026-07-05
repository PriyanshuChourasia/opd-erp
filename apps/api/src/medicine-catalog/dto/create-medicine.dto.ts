import { IsOptional, IsString, IsInt, Min } from 'class-validator';

export class CreateMedicineDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  genericName?: string;

  @IsOptional()
  @IsString()
  brandName?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  strength?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @IsOptional()
  isActive?: boolean;
}
