import { IsArray, IsBoolean, IsEmail, IsISO8601, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

/** Blank strings from optional form fields mean "not provided" — treat them as absent. */
const emptyToUndefined = ({ value }: { value: unknown }) => (value === '' ? undefined : value);

export class CreatePatientDto {
  @IsString()
  name!: string;

  @IsString()
  phone!: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsEmail()
  email?: string;

  @IsOptional()
  @Transform(emptyToUndefined)
  @IsISO8601()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  gender?: string;

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
