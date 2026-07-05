export class CreatePatientDto {
  name!: string;
  phone!: string;
  email?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  address?: string;
  emergencyContact?: string;
  allergies?: string[];
}
