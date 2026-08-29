import { IsArray, IsBoolean, IsEmail, IsISO8601, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

/** Blank strings from optional form fields mean \"not provided\" — treat them as absent. */
const emptyToUndefined = ({ value }: { value: unknown }) => (value === '' ? undefined : value);

export class CreatePatientDto {
  @IsString()
  firstName!: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  middleName?: string;

  @IsString()
  lastName!: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsISO8601()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsString()
  contactNo!: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsString()
  altContactNo?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  bloodGroup?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergies?: string[];

  @IsOptional()
  @IsBoolean()
  isFollowUp?: boolean;
}
