import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateDiagnosisDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  icdCode?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
