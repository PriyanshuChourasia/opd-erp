export type UserableType = 'Doctor' | 'Patient' | 'Nurse' | 'Receptionist' | 'Pharmacist' | 'LabStaff';

export class AuthUserDto {
  id!: string;
  username!: string;
  firstName!: string;
  lastName!: string;
  email!: string;
  roleName!: string;
  permissions!: string[];
  userableType?: UserableType | null;
  userableId?: string | null;
  createdAt?: string;
}

export class AuthResponseDto {
  accessToken!: string;
  user!: AuthUserDto;
}
