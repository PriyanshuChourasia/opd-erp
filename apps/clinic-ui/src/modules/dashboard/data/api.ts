import { apiFetch } from "@/lib/api";
import type { DashboardStats, DashboardCharts } from "./interface";

export async function fetchDashboardStats(params?: { from?: string; to?: string }): Promise<DashboardStats> {
  const searchParams = new URLSearchParams();
  if (params?.from) searchParams.set("from", params.from);
  if (params?.to) searchParams.set("to", params.to);
  const qs = searchParams.toString();
  return apiFetch<DashboardStats>(`/dashboard/stats${qs ? `?${qs}` : ""}`);
}

export async function fetchDashboardCharts(params?: { from?: string; to?: string }): Promise<DashboardCharts> {
  const searchParams = new URLSearchParams();
  if (params?.from) searchParams.set("from", params.from);
  if (params?.to) searchParams.set("to", params.to);
  const qs = searchParams.toString();
  return apiFetch<DashboardCharts>(`/dashboard/charts${qs ? `?${qs}` : ""}`);
}
