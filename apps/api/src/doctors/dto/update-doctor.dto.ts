import { PartialType, PickType } from '@nestjs/mapped-types';
import { CreateDoctorDto } from './create-doctor.dto';

/**
 * For updates, medicalRegistrationNo should not be changeable once set.
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
