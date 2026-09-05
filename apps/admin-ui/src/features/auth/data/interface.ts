export type UserableType =
  | "Doctor"
  | "Patient"
  | "Nurse"
  | "Receptionist"
  | "Pharmacist"
  | "LabStaff";

export interface AuthOrganization {
  id: string;
  name: string;
  status: string;
}

export interface AuthLicense {
  id: string;
  license_number: string;
  status: string;
  plan: string | null;
  start_date: string | null;
  expiry_date: string | null;
}

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
  organizationId?: string | null;
  organization?: AuthOrganization | null;
  license?: AuthLicense | null;
  createdAt?: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}
