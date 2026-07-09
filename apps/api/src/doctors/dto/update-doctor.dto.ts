import { PartialType, PickType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CreateDoctorDto, VerificationStatus } from './create-doctor.dto';

/**
 * For updates, medicalRegistrationNo should not be changeable once set.
 * Verification status changes are handled by the verification endpoint.
 */
export class UpdateDoctorDto extends PartialType(
  PickType(CreateDoctorDto, [
    'qualification',
    'specialization',
    'medicalCouncil',
    'registrationYear',
    'yearsOfExperience',
    'consultationFee',
    'consultationMode',
    'signature',
    'registrationCertificateUrl',
    'degreeCertificateUrl',
    'governmentIdUrl',
  ] as const),
) {}

export class UpdateVerificationStatusDto {
  @IsEnum(VerificationStatus)
  verificationStatus!: VerificationStatus;

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
