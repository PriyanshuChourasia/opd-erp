import { IsOptional, IsString } from 'class-validator';

export class UpdateProcedureOrderDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  result?: string;

  @IsOptional()
  @IsString()
  resultDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
