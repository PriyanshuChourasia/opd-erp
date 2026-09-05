import { apiClient, type ApiError } from "@/lib/api-client";
import type { LoginResponse } from "./interface";

export async function loginApi(
  credential: string,
  password: string,
): Promise<LoginResponse> {
  const isEmail = credential.includes("@");
  const response = await apiClient.post<LoginResponse>("/auth/login", {
    password,
    ...(isEmail ? { email: credential } : { username: credential }),
  });
  return response.data;
}

export async function fetchMe(): Promise<LoginResponse["user"]> {
  const response = await apiClient.get<LoginResponse["user"]>("/auth/me");
  return response.data;
}

export async function logoutApi(): Promise<void> {
  await apiClient.post("/auth/logout");
}

export type { ApiError };
