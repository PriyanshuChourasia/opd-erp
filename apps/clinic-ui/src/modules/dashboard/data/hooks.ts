import { useQuery } from "@tanstack/react-query";
import { fetchDashboardStats, fetchDashboardCharts } from "./api";

export function useDashboardStats(dateRange?: { from?: string | null; to?: string | null }) {
  const from = dateRange?.from ?? undefined;
  const to = dateRange?.to ?? undefined;
  return useQuery({
    queryKey: ["dashboard", "stats", from, to],
    queryFn: () => fetchDashboardStats({ from, to }),
    // 0, not the 30s app default: this is keyed on the user-picked date
    // range, and re-picking a range already used in the last 30s (e.g.
    // cycling Today -> Last 30 days -> Last 7 days) would otherwise be
    // served straight from cache with no request at all — the range label
    // updates but the figures silently go stale.
    staleTime: 0,
    refetchInterval: 15_000,
  });
}

export function useDashboardCharts(dateRange?: { from?: string | null; to?: string | null }) {
  const from = dateRange?.from ?? undefined;
  const to = dateRange?.to ?? undefined;
  return useQuery({
    queryKey: ["dashboard", "charts", from, to],
    queryFn: () => fetchDashboardCharts({ from, to }),
    // See staleTime comment in useDashboardStats above — same reasoning.
    staleTime: 0,
  });
}
