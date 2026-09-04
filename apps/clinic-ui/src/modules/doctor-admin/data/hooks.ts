import { useQuery } from "@tanstack/react-query";
import {
  fetchPatients,
  fetchPatient,
  fetchDoctors,
  fetchPrescriptions,
  fetchAppointments,
} from "@/lib/api";
import { useDashboardStats as useAdminDashboardStats } from "@/modules/dashboard/data/hooks";

/** Dashboard stats — reuse the existing admin stats endpoint. */
export function useDashboardStats() {
  return useAdminDashboardStats();
}

/** Patient search for appointment booking. */
export function usePatientSearch(query: string, enabled: boolean) {
  return useQuery({
    queryKey: ["doctor-admin", "patient-search", query],
    queryFn: () => fetchPatients({ search: query, limit: 8 }),
    enabled,
  });
}

/** Single patient by ID. */
export function usePatient(id: string | undefined) {
  return useQuery({
    queryKey: ["doctor-admin", "patient", id],
    queryFn: () => fetchPatient(id!),
    enabled: !!id,
  });
}

/** All doctors. */
export function useDoctors() {
  return useQuery({
    queryKey: ["doctor-admin", "doctors"],
    queryFn: () => fetchDoctors({ limit: 100 }),
  });
}

/** Paginated prescriptions list. */
export function usePrescriptions(search: string, page: number, limit: number) {
  return useQuery({
    queryKey: ["doctor-admin", "prescriptions", search, page, limit],
    queryFn: () => fetchPrescriptions({ search: search || undefined, page: page + 1, limit }),
    placeholderData: (prev) => prev,
  });
}
