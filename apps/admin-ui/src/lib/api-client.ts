import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

export const STORAGE_KEYS = {
  accessToken: "admin_access_token",
  user: "admin_user",
} as const;

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.accessToken);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.accessToken);
      localStorage.removeItem(STORAGE_KEYS.user);

      const path = window.location.pathname;
      if (path !== "/") {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  },
);

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function extractApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message ?? error.message;
    return Array.isArray(message) ? message.join(", ") : message;
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    return new ApiError(status, extractApiError(error));
  }
  return new ApiError(0, extractApiError(error));
}
