import { apiFetch } from "@/lib/api";
import type { DashboardStats } from "./interface";

export async function fetchDashboardStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>("/dashboard/stats");
}
