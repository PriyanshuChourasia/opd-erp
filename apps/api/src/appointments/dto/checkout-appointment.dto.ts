import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CheckoutAppointmentDto {
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  discount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  tax?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
