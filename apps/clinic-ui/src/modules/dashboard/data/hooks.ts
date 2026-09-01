import { useQuery } from "@tanstack/react-query";
import { fetchDashboardStats, fetchDashboardCharts } from "./api";

export function useDashboardStats(dateRange?: { from?: string | null; to?: string | null }) {
  const from = dateRange?.from ?? undefined;
  const to = dateRange?.to ?? undefined;
  return useQuery({
    queryKey: ["dashboard", "stats", from, to],
    queryFn: () => fetchDashboardStats({ from, to }),
    staleTime: 30_000,
    refetchInterval: 15_000,
  });
}

export function useDashboardCharts(dateRange?: { from?: string | null; to?: string | null }) {
  const from = dateRange?.from ?? undefined;
  const to = dateRange?.to ?? undefined;
  return useQuery({
    queryKey: ["dashboard", "charts", from, to],
    queryFn: () => fetchDashboardCharts({ from, to }),
    staleTime: 60_000,
  });
}
