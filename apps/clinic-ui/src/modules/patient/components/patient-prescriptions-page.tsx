import { useQuery } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { fetchPrescriptions } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const RX_STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  DISPENSED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function PatientPrescriptionsPage() {
  const user = useAppSelector((state) => state.auth.user);

  const { data, isLoading } = useQuery({
    queryKey: ["patient-prescriptions-all", user?.userableId],
    queryFn: () =>
      fetchPrescriptions({
        patientId: user?.userableId ?? undefined,
        limit: 50,
      }),
    enabled: !!user?.userableId,
  });

  const prescriptions = data?.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Prescriptions</h1>
        <p className="text-sm text-muted-foreground">Prescriptions issued by your doctors.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {!user?.userableId ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              Your account is not yet linked to a patient record.
            </p>
          ) : isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
              <ClipboardList className="size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No prescriptions found.</p>
            </div>
          ) : (
            <ul className="divide-y">
              {prescriptions.map((rx) => (
                <li key={rx.id} className="flex items-start justify-between gap-4 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{rx.diagnosis ?? "Prescription"}</p>
                    <p className="text-xs text-muted-foreground">
                      {rx.doctor.name ?? rx.doctor.medicalRegistrationNo} &middot;{" "}
                      {formatDate(rx.createdAt)}
                    </p>
                    {rx.items.length > 0 && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {rx.items.map((item) => item.medicineName).join(", ")}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={`shrink-0 text-[10px] ${RX_STATUS_STYLES[rx.status] ?? ""}`}
                  >
                    {rx.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
