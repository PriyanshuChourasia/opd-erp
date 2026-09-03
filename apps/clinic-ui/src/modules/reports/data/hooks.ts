import { useQuery } from "@tanstack/react-query";
import {
  fetchRevenueByCategory,
  fetchOutstandingBills,
  fetchDoctorPerformance,
  fetchTopMedicines,
  fetchDailyOpdSummary,
  fetchDoctorWiseOpdReport,
  fetchRevenueCollectionReport,
  fetchOutstandingPayments,
} from "./api";

// staleTime: 0 on every date-range-filtered report query below (not the 30s
// app default) — otherwise re-picking a range already fetched in the last
// 30s (e.g. cycling through the DateRangePicker's presets) is served from
// cache with no request at all: the picker's label updates but the report
// silently doesn't refresh.

export function useRevenueByCategory(from?: string, to?: string) {
  return useQuery({
    queryKey: ["reports", "revenue-by-category", from, to],
    queryFn: () => fetchRevenueByCategory(from, to),
    staleTime: 0,
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
    staleTime: 0,
  });
}

export function useTopMedicines(from?: string, to?: string, limit?: number) {
  return useQuery({
    queryKey: ["reports", "top-medicines", from, to, limit],
    queryFn: () => fetchTopMedicines(from, to, limit),
    staleTime: 0,
  });
}

export function useDailyOpdSummary(from?: string, to?: string, doctorId?: string) {
  return useQuery({
    queryKey: ["reports", "daily-opd-summary", from, to, doctorId],
    queryFn: () => fetchDailyOpdSummary(from, to, doctorId),
    staleTime: 0,
  });
}

export function useDoctorWiseOpdReport(from?: string, to?: string) {
  return useQuery({
    queryKey: ["reports", "doctor-wise-opd", from, to],
    queryFn: () => fetchDoctorWiseOpdReport(from, to),
    staleTime: 0,
  });
}

export function useRevenueCollectionReport(
  from?: string,
  to?: string,
  doctorId?: string,
  paymentStatus?: string,
  paymentMethod?: string,
  page?: number,
  limit?: number,
) {
  return useQuery({
    queryKey: ["reports", "revenue-collection", from, to, doctorId, paymentStatus, paymentMethod, page, limit],
    queryFn: () => fetchRevenueCollectionReport(from, to, doctorId, paymentStatus, paymentMethod, page, limit),
    staleTime: 0,
  });
}

export function useOutstandingPayments(
  from?: string,
  to?: string,
  doctorId?: string,
  patientId?: string,
  paymentStatus?: string,
  page?: number,
  limit?: number,
) {
  return useQuery({
    queryKey: ["reports", "outstanding-payments", from, to, doctorId, patientId, paymentStatus, page, limit],
    queryFn: () => fetchOutstandingPayments(from, to, doctorId, patientId, paymentStatus, page, limit),
    staleTime: 0,
  });
}
