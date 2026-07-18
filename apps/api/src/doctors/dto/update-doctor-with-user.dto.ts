import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateDoctorWithUserDto } from './create-doctor-with-user.dto';

/**
 * Partial DTO for updating a Doctor together with its linked User account
 * and optional Address. All fields are optional — only provided fields
 * will be updated on the respective models.
 *
 * `medicalRegistrationNo` is intentionally removed: it should not be
 * changeable after creation.
 */
export class UpdateDoctorWithUserDto extends PartialType(
  OmitType(CreateDoctorWithUserDto, ['medicalRegistrationNo'] as const),
) {}

/**
 * Response shape returned by `findOne` and `updateWithUser`.
 */
export interface DoctorWithUser {
  id: string;
  name?: string | null;
  qualification?: string | null;
  specialization?: string | null;
  medicalRegistrationNo: string;
  medicalCouncil?: string | null;
  registrationYear?: number | null;
  yearsOfExperience?: number | null;
  consultationFee: number;
  consultationMode: string;
  verificationStatus: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  /** The linked User account, if one exists. */
  user?: {
    id: string;
    username: string;
    firstName: string;
    middleName?: string | null;
    lastName: string;
    email: string;
    mobileNumber?: string | null;
    gender?: string | null;
    roleId: string;
  } | null;
}
