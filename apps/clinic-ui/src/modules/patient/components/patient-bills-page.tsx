import { useQuery } from "@tanstack/react-query";
import { Receipt } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { fetchBills } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";

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
                    <StatusBadge status={bill.status} />
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
