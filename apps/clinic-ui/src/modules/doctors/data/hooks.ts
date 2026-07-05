import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchDoctors, fetchDoctor, createDoctor, updateDoctor, deleteDoctor, fetchDoctorSchedules, upsertDoctorSchedule, deleteDoctorSchedule } from "./api";

export function useDoctors(search?: string) {
  return useQuery({ queryKey: ["doctors", search], queryFn: () => fetchDoctors(search) });
}

export function useDoctor(id: string) {
  return useQuery({ queryKey: ["doctor", id], queryFn: () => fetchDoctor(id), enabled: !!id });
}

export function useDoctorSchedules(doctorId: string | null) {
  return useQuery({
    queryKey: ["doctor-schedules", doctorId],
    queryFn: () => fetchDoctorSchedules(doctorId!),
    enabled: !!doctorId,
  });
}

export function useCreateDoctor() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createDoctor, onSuccess: () => qc.invalidateQueries({ queryKey: ["doctors"] }) });
}

export function useUpdateDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<import("@/lib/api").CreateDoctorInput> }) => updateDoctor(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doctors"] }),
  });
}

export function useDeleteDoctor() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: deleteDoctor, onSuccess: () => qc.invalidateQueries({ queryKey: ["doctors"] }) });
}
