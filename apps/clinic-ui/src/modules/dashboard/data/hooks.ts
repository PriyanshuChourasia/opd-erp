import { useQuery } from "@tanstack/react-query";
import { fetchDashboardCharts, fetchDashboardStats } from "./api";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: fetchDashboardStats,
    staleTime: 30_000,
  });
}

export function useDashboardCharts() {
  return useQuery({
    queryKey: ["dashboard", "charts"],
    queryFn: fetchDashboardCharts,
    staleTime: 30_000,
  });
}
