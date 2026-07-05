import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAppointments, createAppointment, updateAppointmentStatus, fetchDoctorSlots, fetchBills, updateBillStatus } from "./api";

export function useAppointments(filters?: { doctorId?: string; date?: string; patientId?: string }) {
  return useQuery({ queryKey: ["appointments", filters?.doctorId, filters?.date], queryFn: () => fetchAppointments(filters), refetchInterval: 15_000 });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createAppointment, onSuccess: () => { qc.invalidateQueries({ queryKey: ["appointments"] }); qc.invalidateQueries({ queryKey: ["doctor-slots"] }); } });
}

export function useUpdateAppointmentStatus() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, status }: { id: string; status: string }) => updateAppointmentStatus(id, status), onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }) });
}

export function useDoctorSlots(doctorId: string, date: string) {
  return useQuery({ queryKey: ["doctor-slots", doctorId, date], queryFn: () => fetchDoctorSlots(doctorId, date), enabled: !!doctorId && !!date });
}

export function useBills() {
  return useQuery({ queryKey: ["bills"], queryFn: fetchBills, refetchInterval: 15_000 });
}

export function useUpdateBillStatus() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, status }: { id: string; status: string }) => updateBillStatus(id, status), onSuccess: () => qc.invalidateQueries({ queryKey: ["bills"] }) });
}
