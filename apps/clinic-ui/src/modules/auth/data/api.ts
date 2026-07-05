import { apiFetch } from "@/lib/api";
import type { LoginResponse, RegisterResponse } from "./interface";

export function loginApi(email: string, password: string) {
  return apiFetch<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function registerApi(name: string, email: string, password: string) {
  return apiFetch<RegisterResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}
