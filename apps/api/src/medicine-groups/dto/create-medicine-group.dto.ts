import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateMedicineGroupDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
