import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class LicenseFeatureMappingDto {
  @IsString()
  featureId!: string;

  @IsOptional()
  @IsString()
  value?: string;
}

export class CreateLicenseDto {
  @IsString()
  organizationId!: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsString()
  planId!: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  expiresAt!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxUsers?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxDevices?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LicenseFeatureMappingDto)
  features?: LicenseFeatureMappingDto[];
}