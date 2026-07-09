import { apiFetch } from "@/lib/api";
import type { LoginResponse, RegisterResponse } from "./interface";

export function loginApi(credential: string, password: string) {
  const isEmail = credential.includes("@");
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: isEmail
      ? JSON.stringify({ email: credential, password })
      : JSON.stringify({ username: credential, password }),
  });
}

export function registerApi(
  username: string,
  firstName: string,
  lastName: string,
  email: string,
  password: string,
) {
  return apiFetch<RegisterResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, firstName, lastName, email, password }),
  });
}
