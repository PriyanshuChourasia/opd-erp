import { apiFetch } from "@/lib/api";
import type { Bill, BillStatus } from "./interface";

export async function fetchBills(): Promise<Bill[]> {
  return apiFetch<Bill[]>("/billing");
}

export async function updateBillStatus(id: string, status: BillStatus): Promise<Bill> {
  return apiFetch<Bill>(`/billing/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
}
