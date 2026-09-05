import { STORAGE_KEYS } from "@/lib/api-client";
import type { AuthUser, LoginResponse } from "./interface";

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
}

export function loadAuth(): AuthState {
  if (typeof window === "undefined") return { user: null, accessToken: null };
  const accessToken = localStorage.getItem(STORAGE_KEYS.accessToken);
  const rawUser = localStorage.getItem(STORAGE_KEYS.user);
  let user: AuthUser | null = null;
  if (rawUser) {
    try {
      user = JSON.parse(rawUser) as AuthUser;
    } catch {
      user = null;
      localStorage.removeItem(STORAGE_KEYS.user);
    }
  }
  return {
    user: accessToken && user ? user : null,
    accessToken: accessToken && user ? accessToken : null,
  };
}

export function persistAuth(data: LoginResponse): void {
  localStorage.setItem(STORAGE_KEYS.accessToken, data.accessToken);
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(data.user));
}

export function hasToken(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem(STORAGE_KEYS.accessToken));
}

export function clearAuth(): void {
  localStorage.removeItem(STORAGE_KEYS.accessToken);
  localStorage.removeItem(STORAGE_KEYS.user);
}
