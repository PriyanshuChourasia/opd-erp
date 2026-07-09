import axios from "axios";
import axiosRetry from "axios-retry";

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

// const API_BASE = "https://opdapi.codymitra.com/api";

/**
 * Axios instance pre-configured with the API base URL from the environment.
 *
 * All API calls go through this instance so that request/response interceptors
 * are applied consistently — JWT injection, retry on transient failures,
 * and centralized error handling.
 */
export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

// ─── Retry configuration ─────────────────────────────────────

axiosRetry(apiClient, {
  retries: 2,
  retryDelay: (retryCount) => retryCount * 1_000, // 1s, 2s
  retryCondition: (error) => {
    // `isNetworkOrIdempotentRequestError` retries on:
    //   - Network errors (no response) for ALL methods
    //   - 5xx server errors ONLY for idempotent methods (GET, HEAD, PUT, DELETE)
    // We additionally add 429 (rate-limit) for all methods — safer than
    // blindly retrying mutations on server errors, which could create
    // duplicate records.
    if (axiosRetry.isNetworkOrIdempotentRequestError(error)) return true;
    return error.response?.status === 429;
  },
  onRetry: (retryCount, error) => {
    if (import.meta.env.DEV) {
      console.warn(`[API] Retry ${retryCount}/2 — ${error.config?.url}`, error.message);
    }
  },
});

// ─── Request interceptor — inject JWT ────────────────────────

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("clinic_access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor — centralized error handling ───────

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 — token expired or invalid → clear auth & redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem("clinic_access_token");
      localStorage.removeItem("clinic_user");

      // Only redirect if we're not already on the login/landing page
      const path = window.location.pathname;
      if (path !== "/login" && path !== "/") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  },
);

// ─── Typed helpers ───────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Extract a human-readable message from an axios error. */
export function extractApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message ?? error.message;
    return Array.isArray(message) ? message.join(", ") : message;
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}

/** Convert an unknown error into an `ApiError` with status code. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    const message = extractApiError(error);
    return new ApiError(status, message);
  }
  return new ApiError(0, extractApiError(error));
}
