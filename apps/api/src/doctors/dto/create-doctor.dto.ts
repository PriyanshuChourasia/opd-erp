export class CreateDoctorDto {
  name!: string;
  email!: string;
  phone?: string;
  specialization?: string;
  licenseNumber!: string;
}
