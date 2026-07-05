export interface Bill {
  id: string;
  invoiceNo: string;
  status: "PENDING" | "PAID" | "PARTIAL" | "REFUNDED" | "CANCELLED";
  total: number;
  discount: number;
  paymentMethod: string;
  patient?: { id: string; name: string; phone: string } | null;
  items: { id: string; itemName: string; quantity: number; unitPrice: number }[];
  createdAt: string;
}

export type BillStatus = Bill["status"];
