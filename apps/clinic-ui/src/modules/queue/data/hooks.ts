import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchQueue, createQueueEntry, updateQueueStatus, deleteQueueEntry } from "./api";

export function useQueue(doctorId?: string) {
  return useQuery({
    queryKey: ["queue", doctorId],
    queryFn: () => fetchQueue(doctorId),
    refetchInterval: 15_000,
  });
}

export function useAddToQueue() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: createQueueEntry, onSuccess: () => qc.invalidateQueries({ queryKey: ["queue"] }) });
}

export function useUpdateQueueStatus() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, status }: { id: string; status: string }) => updateQueueStatus(id, status), onSuccess: () => qc.invalidateQueries({ queryKey: ["queue"] }) });
}

export function useDeleteQueueEntry() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: deleteQueueEntry, onSuccess: () => qc.invalidateQueries({ queryKey: ["queue"] }) });
}
