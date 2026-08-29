import { apiFetch, type Bill } from "@/lib/api";
import type { PaymentMethod } from "./interface";

export async function searchMedicines(q: string): Promise<{ id: string; name: string; brandName: string | null; genericName: string | null; strength: string | null; price: number }[]> {
  const res = await apiFetch<{ data: { id: string; name: string; brandName: string | null; genericName: string | null; strength: string | null; price: number }[] }>(
    `/medicine-catalog?search=${encodeURIComponent(q)}&limit=50`,
  );
  return res.data;
}

export async function searchPatients(q: string): Promise<any[]> {
  const res = await apiFetch<{ data: any[] }>(`/patients?search=${encodeURIComponent(q)}`);
  return res.data;
}

export async function createBill(data: {
  patientId: string | null;
  appointmentId?: string;
  items: { itemType: string; itemId?: string; itemName: string; quantity: number; unitPrice: number }[];
  discount: number;
  paymentMethod: PaymentMethod;
}): Promise<Bill> {
  return apiFetch<Bill>("/billing", { method: "POST", body: JSON.stringify(data) });
}
