import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateDiagnosisSystemDto {
  @IsString()
  @MinLength(2)
  code!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
