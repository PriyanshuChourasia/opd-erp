import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ConsultationMode } from './create-doctor.dto';
import { AddressType } from '../../addresses/dto/create-address.dto';

/**
 * Nested DTO for a single address entry inside the addresses array.
 */
export class AddressEntryDto {
  @IsOptional()
  @IsEnum(AddressType)
  addressType?: AddressType;

  @IsString()
  @MinLength(3)
  addressLine1!: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsOptional()
  @IsString()
  landmark?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

/**
 * Single DTO for creating a Doctor together with its User account and
 * optional Addresses in one API call. The backend distributes the data into
 * the respective models.
 *
 * Supports either:
 * - Legacy flat address fields (addressType, addressLine1, …) for backward compat
 * - New `addresses` array for multiple addresses per doctor
 */
export class CreateDoctorWithUserDto {
  // ── User Account ──────────────────────────────────────────

  @IsString()
  @MinLength(3)
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'username must contain only letters, numbers, and underscores' })
  username!: string;

  @IsString()
  @MinLength(2)
  firstName!: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsString()
  @MinLength(2)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'mobileNumber must be a valid phone number' })
  mobileNumber!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  // ── Doctor Professional ──────────────────────────────────

  @IsOptional()
  @IsString()
  qualification?: string;

  @IsOptional()
  @IsString()
  specialization?: string;

  @IsString()
  medicalRegistrationNo!: string;

  @IsOptional()
  @IsString()
  medicalCouncil?: string;

  @IsOptional()
  @IsInt()
  registrationYear?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  yearsOfExperience?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  consultationFee?: number;

  @IsOptional()
  @IsEnum(ConsultationMode)
  consultationMode?: ConsultationMode;

  @IsOptional()
  @IsString()
  signature?: string;

  @IsOptional()
  @IsString()
  registrationCertificateUrl?: string;

  @IsOptional()
  @IsString()
  degreeCertificateUrl?: string;

  @IsOptional()
  @IsString()
  governmentIdUrl?: string;

  // ── Addresses (optional — supports multiple) ──────────────

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddressEntryDto)
  addresses?: AddressEntryDto[];

  // ── Legacy flat address fields (backward compat) ──────────

  @IsOptional()
  @IsEnum(AddressType)
  addressType?: AddressType;

  @IsOptional()
  @IsString()
  @MinLength(3)
  addressLine1?: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsOptional()
  @IsString()
  landmark?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;
}
