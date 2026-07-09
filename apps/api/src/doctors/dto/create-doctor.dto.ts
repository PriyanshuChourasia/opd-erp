import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export enum ConsultationMode {
  OFFLINE = 'OFFLINE',
  ONLINE = 'ONLINE',
  BOTH = 'BOTH',
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export class CreateDoctorDto {
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

  @IsOptional()
  @IsEnum(VerificationStatus)
  verificationStatus?: VerificationStatus;

  @IsOptional()
  @IsString()
  isActive?: boolean;
}
