import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateRefundDto {
  @IsInt()
  @Min(1)
  amount!: number;

  @IsString()
  reason!: string;

  @IsOptional()
  @IsString()
  method?: string;

  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
