import { useQuery } from "@tanstack/react-query";
import {
  fetchRevenueByCategory,
  fetchOutstandingBills,
  fetchDoctorPerformance,
  fetchPrescriptionFulfillment,
  fetchTopMedicines,
  fetchPatientDemographics,
  fetchInactivePatients,
  fetchDiagnosticsTurnaround,
  fetchAppointmentMix,
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

export function usePrescriptionFulfillment(from?: string, to?: string) {
  return useQuery({
    queryKey: ["reports", "prescription-fulfillment", from, to],
    queryFn: () => fetchPrescriptionFulfillment(from, to),
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

export function usePatientDemographics() {
  return useQuery({
    queryKey: ["reports", "patient-demographics"],
    queryFn: fetchPatientDemographics,
    staleTime: 30_000,
  });
}

export function useInactivePatients(daysSinceLastVisit?: number, page?: number) {
  return useQuery({
    queryKey: ["reports", "inactive-patients", daysSinceLastVisit, page],
    queryFn: () => fetchInactivePatients(daysSinceLastVisit, page),
    staleTime: 30_000,
  });
}

export function useDiagnosticsTurnaround(from?: string, to?: string) {
  return useQuery({
    queryKey: ["reports", "diagnostics-turnaround", from, to],
    queryFn: () => fetchDiagnosticsTurnaround(from, to),
    staleTime: 30_000,
  });
}

export function useAppointmentMix(from?: string, to?: string) {
  return useQuery({
    queryKey: ["reports", "appointment-mix", from, to],
    queryFn: () => fetchAppointmentMix(from, to),
    staleTime: 30_000,
  });
}
