export type UserableType = 'Doctor' | 'Patient' | 'Nurse' | 'Receptionist' | 'Pharmacist' | 'LabStaff';

export class AuthUserDto {
  id!: string;
  username!: string;
  firstName!: string;
  lastName!: string;
  email!: string;
  roleId!: string;
  roleName!: string;
  permissions!: string[];
  permissionSlugs?: string[];
  organizationId?: string | null;
  userableType?: UserableType | null;
  userableId?: string | null;
  createdAt?: string;
}

export class AuthResponseDto {
  accessToken!: string;
  user!: AuthUserDto;
}
