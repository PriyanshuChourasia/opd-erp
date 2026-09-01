import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CheckoutAppointmentDto {
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @IsOptional()
  @IsString()
  discountRuleId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  tax?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  paidAmount?: number;
}
