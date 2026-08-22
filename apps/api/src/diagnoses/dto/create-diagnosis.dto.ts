import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateDiagnosisDto {
  @IsOptional()
  @IsString()
  diagnosisSystemId?: string;

  @IsString()
  @MinLength(2)
  code!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
