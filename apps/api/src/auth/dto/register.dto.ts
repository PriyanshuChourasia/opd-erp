import { IsDateString, IsEmail, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class RegisterDto {
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

  @IsOptional()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'mobileNumber must be a valid phone number' })
  mobileNumber?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  profilePhotoUrl?: string;

  @IsOptional()
  @IsString()
  qualification?: string;

  /** Join an existing tenant by its organization code (invite-style join). */
  @IsOptional()
  @IsString()
  organizationCode?: string;

  /** When no organizationCode is given, the registration provisions a new
   *  tenant Organization named here (defaults to "<firstName>'s Clinic"). */
  @IsOptional()
  @IsString()
  organizationName?: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
