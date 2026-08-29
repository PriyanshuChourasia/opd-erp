import { IsOptional, IsString } from 'class-validator';

export class UpdateRadiologyOrderDto {
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
