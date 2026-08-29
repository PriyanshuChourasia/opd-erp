import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateFinancialYearDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  startDate!: string;

  @IsString()
  endDate!: string;

  @IsOptional()
  @IsBoolean()
  isCurrent?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  companyId?: string;
}
