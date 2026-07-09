import { IsBoolean, IsEnum, IsLatitude, IsLongitude, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export enum AddressType {
  CLINIC = 'CLINIC',
  HOME = 'HOME',
  BILLING = 'BILLING',
  OTHER = 'OTHER',
}

export class CreateAddressDto {
  @IsEnum(AddressType)
  addressType!: AddressType;

  @IsString()
  @MinLength(3)
  @MaxLength(255)
  addressLine1!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  addressLine2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  landmark?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  district?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  // Polymorphic fields — set by the service, not by callers directly
  @IsString()
  addressableType!: string;

  @IsString()
  addressableId!: string;
}
