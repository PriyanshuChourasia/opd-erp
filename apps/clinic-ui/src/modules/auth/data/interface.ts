import type { AuthUser } from "@/store/auth-slice";

export type { AuthUser };

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface RegisterResponse {
  accessToken: string;
  user: AuthUser;
}
