import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchPatients, fetchPatient, createPatient, updatePatient, deletePatient } from "./api";
import type { CreatePatientInput } from "./interface";

export function usePatients(search?: string) {
  return useQuery({
    queryKey: ["patients", search],
    queryFn: () => fetchPatients(search),
  });
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: ["patient", id],
    queryFn: () => fetchPatient(id),
    enabled: !!id,
  });
}

export function useCreatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}

export function useUpdatePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreatePatientInput> }) => updatePatient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}

export function useDeletePatient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePatient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    },
  });
}
