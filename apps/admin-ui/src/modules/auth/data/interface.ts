export interface AuthUser {
  id: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  email: string;
  mobileNumber?: string | null;
  roleName: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}
