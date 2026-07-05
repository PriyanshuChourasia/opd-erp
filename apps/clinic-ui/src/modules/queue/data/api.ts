import { apiFetch, type QueueEntry, type CreateQueueEntryInput } from "@/lib/api";

export async function fetchQueue(doctorId?: string): Promise<QueueEntry[]> {
  const url = doctorId ? `/queue?doctorId=${doctorId}` : "/queue";
  return apiFetch<QueueEntry[]>(url);
}

export async function createQueueEntry(data: CreateQueueEntryInput): Promise<QueueEntry> {
  return apiFetch<QueueEntry>("/queue", { method: "POST", body: JSON.stringify(data) });
}

export async function updateQueueStatus(id: string, status: string): Promise<QueueEntry> {
  return apiFetch<QueueEntry>(`/queue/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
}

export async function deleteQueueEntry(id: string): Promise<void> {
  return apiFetch<void>(`/queue/${id}`, { method: "DELETE" });
}
