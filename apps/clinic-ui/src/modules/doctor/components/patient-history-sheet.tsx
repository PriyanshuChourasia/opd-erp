import { useQuery } from "@tanstack/react-query";
import { History, Pill } from "lucide-react";
import { fetchPrescriptions } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface PatientHistorySheetProps {
  patientId: string | null;
  patientName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Read-only slide-over listing a patient's past prescriptions/consultations. */
export function PatientHistorySheet({ patientId, patientName, open, onOpenChange }: PatientHistorySheetProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["prescriptions", "patient-history", patientId],
    queryFn: () => fetchPrescriptions({ patientId: patientId!, limit: 20 }),
    enabled: open && !!patientId,
  });

  const prescriptions = data?.data ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="size-4" />
            Past Consultations
          </SheetTitle>
          <SheetDescription>
            {patientName ? `Consultation history for ${patientName}` : "Consultation history"}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-4">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
          ) : prescriptions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <History className="size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No past consultations recorded</p>
            </div>
          ) : (
            prescriptions.map((rx) => (
              <div key={rx.id} className="space-y-2 rounded-none border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    {new Date(rx.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <Badge variant="outline" className="text-[10px]">Dr. {rx.doctor?.name ?? "—"}</Badge>
                </div>
                {rx.diagnosis && <p className="text-sm font-medium">{rx.diagnosis}</p>}
                {rx.items.length > 0 && (
                  <ul className="space-y-1">
                    {rx.items.map((item) => (
                      <li key={item.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Pill className="size-3 shrink-0 text-violet-500" />
                        <span className="text-foreground">{item.medicineName}</span>
                        <span>· {item.dosage}</span>
                        {item.duration && <span>· {item.duration}</span>}
                      </li>
                    ))}
                  </ul>
                )}
                {rx.notes && <p className="text-xs italic text-muted-foreground">{rx.notes}</p>}
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
