export type UserableType =
  | "Doctor"
  | "Patient"
  | "Nurse"
  | "Receptionist"
  | "Pharmacist"
  | "LabStaff";

export interface AuthUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  roleId: string;
  roleName: string;
  permissions: string[];
  userableType?: UserableType | null;
  userableId?: string | null;
  createdAt?: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}
