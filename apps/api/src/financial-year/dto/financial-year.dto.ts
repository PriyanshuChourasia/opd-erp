import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFinancialYearDto {
  @IsString()
  @IsOptional()
  label?: string;

  @IsString()
  @IsNotEmpty()
  startDate: string;

  @IsString()
  @IsNotEmpty()
  endDate: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateFinancialYearDto {
  @IsString()
  @IsOptional()
  label?: string;

  @IsString()
  @IsOptional()
  startDate?: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
