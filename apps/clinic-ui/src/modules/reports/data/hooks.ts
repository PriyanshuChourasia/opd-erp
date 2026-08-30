import { useQuery } from "@tanstack/react-query";
import {
  fetchRevenueByCategory,
  fetchOutstandingBills,
  fetchDoctorPerformance,
  fetchTopMedicines,
  fetchDailyOpdSummary,
} from "./api";

export function useRevenueByCategory(from?: string, to?: string) {
  return useQuery({
    queryKey: ["reports", "revenue-by-category", from, to],
    queryFn: () => fetchRevenueByCategory(from, to),
    staleTime: 30_000,
  });
}

export function useOutstandingBills() {
  return useQuery({
    queryKey: ["reports", "outstanding-bills"],
    queryFn: fetchOutstandingBills,
    staleTime: 30_000,
  });
}

export function useDoctorPerformance(from?: string, to?: string) {
  return useQuery({
    queryKey: ["reports", "doctor-performance", from, to],
    queryFn: () => fetchDoctorPerformance(from, to),
    staleTime: 30_000,
  });
}

export function useTopMedicines(from?: string, to?: string, limit?: number) {
  return useQuery({
    queryKey: ["reports", "top-medicines", from, to, limit],
    queryFn: () => fetchTopMedicines(from, to, limit),
    staleTime: 30_000,
  });
}

export function useDailyOpdSummary(from?: string, to?: string, doctorId?: string) {
  return useQuery({
    queryKey: ["reports", "daily-opd-summary", from, to, doctorId],
    queryFn: () => fetchDailyOpdSummary(from, to, doctorId),
    staleTime: 30_000,
  });
}
