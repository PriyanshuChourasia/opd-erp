import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateOrganisationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  registrationFee?: number;

  @IsOptional()
  @IsBoolean()
  discountEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxDiscountPercent?: number;

  @IsOptional()
  @IsString()
  defaultDiscountType?: string;
}
