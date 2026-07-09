import { apiFetch } from "@/lib/api";
import type { DashboardCharts, DashboardStats } from "./interface";

export async function fetchDashboardStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>("/dashboard/stats");
}

export async function fetchDashboardCharts(): Promise<DashboardCharts> {
  return apiFetch<DashboardCharts>("/dashboard/charts");
}
