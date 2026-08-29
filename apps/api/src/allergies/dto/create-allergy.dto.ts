import { IsBoolean, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { AllergySeverity, AllergyCategory } from '@prisma/client';

export class CreateAllergyDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(AllergySeverity)
  severity?: AllergySeverity;

  @IsOptional()
  @IsEnum(AllergyCategory)
  category?: AllergyCategory;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
