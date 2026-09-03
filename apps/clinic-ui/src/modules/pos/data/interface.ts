export interface CartItem {
  id: string;
  itemType?: string;
  itemId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export type DiscountMode = "percent" | "flat";
export type PaymentMethod = "CASH" | "CARD" | "UPI";

export const CONSULTATION_TYPES = [
  { value: "WALK_IN", label: "Walk-in Registration", amount: 100 },
  { value: "CONSULTATION", label: "Consultation", amount: 300 },
] as const;

export const paymentMethods = [
  { value: "CASH" as const, label: "Cash" },
  { value: "CARD" as const, label: "Card" },
  { value: "UPI" as const, label: "UPI" },
];

export const NEXT_APPT_STATUS: Record<string, import("@/lib/api").AppointmentStatus | null> = {
  SCHEDULED: "CONFIRMED", CONFIRMED: "CHECKED_IN", CHECKED_IN: "IN_PROGRESS", IN_PROGRESS: "COMPLETED", COMPLETED: null, CANCELLED: null, NO_SHOW: null,
};

export const APPT_STATUS_STYLES: Record<string, string> = {
  SCHEDULED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  CONFIRMED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  CHECKED_IN: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  NO_SHOW: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export const BILL_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  PAID: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  PARTIAL: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  REFUNDED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export function currency(value: number) { const n = Number(value) || 0; return `₹${n.toFixed(2)}`; }
export function todayStr() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 10);
}
