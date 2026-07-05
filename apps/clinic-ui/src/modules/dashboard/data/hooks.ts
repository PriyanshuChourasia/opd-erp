import { useQuery } from "@tanstack/react-query";
import { fetchDashboardStats } from "./api";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: fetchDashboardStats,
    staleTime: 30_000,
  });
}
