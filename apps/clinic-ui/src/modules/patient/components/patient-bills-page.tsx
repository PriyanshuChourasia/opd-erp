import { useQuery } from "@tanstack/react-query";
import { Receipt } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { fetchBills } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const BILL_STATUS_STYLES: Record<string, string> = {
  PAID: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  PARTIAL: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  REFUNDED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function currency(value: number) {
  return `₹${value.toFixed(2)}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function PatientBillsPage() {
  const user = useAppSelector((state) => state.auth.user);

  const { data, isLoading } = useQuery({
    queryKey: ["patient-bills-all", user?.userableId],
    queryFn: () =>
      fetchBills({
        patientId: user?.userableId ?? undefined,
        limit: 50,
      }),
    enabled: !!user?.userableId,
  });

  const bills = data?.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bills</h1>
        <p className="text-sm text-muted-foreground">Invoices raised against your visits.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {!user?.userableId ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              Your account is not yet linked to a patient record.
            </p>
          ) : isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : bills.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <Receipt className="size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No bills found.</p>
            </div>
          ) : (
            <ul className="divide-y">
              {bills.map((bill) => (
                <li key={bill.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{bill.invoiceNo}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(bill.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium tabular-nums">
                      {currency(bill.total)}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${BILL_STATUS_STYLES[bill.status] ?? ""}`}
                    >
                      {bill.status}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
