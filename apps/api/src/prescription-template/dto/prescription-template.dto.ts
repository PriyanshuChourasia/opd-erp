import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePrescriptionTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  type?: string; // prescription | diagnosis | test | appointment_slip

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  clinicName?: string;

  @IsString()
  @IsOptional()
  doctorName?: string;

  @IsString()
  @IsOptional()
  doctorSpecialization?: string;

  @IsString()
  @IsOptional()
  doctorQualification?: string;

  @IsString()
  @IsOptional()
  doctorRegNo?: string;

  @IsString()
  @IsOptional()
  clinicAddress?: string;

  @IsString()
  @IsOptional()
  clinicPhone?: string;

  @IsString()
  @IsOptional()
  clinicEmail?: string;

  @IsString()
  @IsOptional()
  clinicWebsite?: string;

  @IsOptional()
  layout?: Record<string, any>;

  @IsString()
  @IsOptional()
  doctorId?: string;
}

export class AssignDoctorDto {
  @IsString()
  @IsNotEmpty()
  doctorId!: string;
}

export class UpdatePrescriptionTemplateDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  type?: string; // prescription | diagnosis | test | appointment_slip

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  clinicName?: string;

  @IsString()
  @IsOptional()
  doctorName?: string;

  @IsString()
  @IsOptional()
  doctorSpecialization?: string;

  @IsString()
  @IsOptional()
  doctorQualification?: string;

  @IsString()
  @IsOptional()
  doctorRegNo?: string;

  @IsString()
  @IsOptional()
  clinicAddress?: string;

  @IsString()
  @IsOptional()
  clinicPhone?: string;

  @IsString()
  @IsOptional()
  clinicEmail?: string;

  @IsString()
  @IsOptional()
  clinicWebsite?: string;

  @IsOptional()
  layout?: Record<string, any>;

  @IsString()
  @IsOptional()
  doctorId?: string;
}
