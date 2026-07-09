import { apiFetch, type Bill } from "@/lib/api";
import type { PaymentMethod } from "./interface";

export async function searchMedicines(q: string): Promise<{ id: string; brandName: string; genericName: string; strength: string }[]> {
  const res = await apiFetch<{ data: { id: string; brandName: string; genericName: string; strength: string }[] }>(
    `/medicine-catalog?search=${encodeURIComponent(q)}`,
  );
  return res.data;
}

export async function searchPatients(q: string): Promise<any[]> {
  const res = await apiFetch<{ data: any[] }>(`/patients?search=${encodeURIComponent(q)}`);
  return res.data;
}

export async function createBill(data: {
  patientId: string | null;
  items: { itemType: string; itemName: string; quantity: number; unitPrice: number }[];
  discount: number;
  paymentMethod: PaymentMethod;
}): Promise<Bill> {
  return apiFetch<Bill>("/billing", { method: "POST", body: JSON.stringify(data) });
}
