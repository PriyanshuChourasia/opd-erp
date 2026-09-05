import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPrescription, fetchPrescriptions, getPatientName, type Appointment } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ChevronDown, FileText, History } from "lucide-react";
import { DocumentGallery } from "@/modules/documents/components/document-viewer";

interface AppointmentPrescriptionSheetProps {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppointmentPrescriptionSheet({ appointment, open, onOpenChange }: AppointmentPrescriptionSheetProps) {
  const queryClient = useQueryClient();
  const [rxDiagnosis, setRxDiagnosis] = useState("");
  const [rxDoctorRemarks, setRxDoctorRemarks] = useState("");
  const [rxShowDocs, setRxShowDocs] = useState(false);
  const [rxShowHistory, setRxShowHistory] = useState(false);

  const rxPatientPrescriptions = useQuery({
    queryKey: ["patient-prescriptions", appointment?.patientId],
    queryFn: () => fetchPrescriptions({ patientId: appointment!.patientId, page: 1, limit: 10 }),
    enabled: !!appointment?.patientId && rxShowHistory,
  });
  const rxPastPrescriptions = useMemo(() => rxPatientPrescriptions.data?.data ?? [], [rxPatientPrescriptions.data]);

  const createPrescriptionMutation = useMutation({
    mutationFn: () => {
      if (!appointment) throw new Error("No appointment selected");
      return createPrescription({
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        diagnosis: rxDiagnosis || undefined,
        notes: rxDoctorRemarks.trim(),
        items: [{
          medicineId: "remarks",
          medicineName: "Verbal Instructions",
          dosage: "As per doctor's advice",
          quantity: 1,
        }],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
      setRxDiagnosis("");
      setRxDoctorRemarks("");
      onOpenChange(false);
      toast.success("Prescription created with doctor's remarks");
    },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  function closeSheet() {
    setRxShowDocs(false);
    setRxShowHistory(false);
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) closeSheet(); }}>
      <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create Prescription</SheetTitle>
          <SheetDescription>
            {appointment ? `Record doctor's remarks for ${appointment.patient ? getPatientName(appointment.patient) : ""}` : ""}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-4 px-4 pb-4">
          {/* Patient & Doctor info */}
          <div className="rounded-none border bg-muted/20 p-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Patient</span>
              <span className="font-medium">{appointment?.patient ? getPatientName(appointment.patient) : "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Doctor</span>
              <span className="font-medium">{appointment?.doctor?.name ?? appointment?.doctor?.medicalRegistrationNo ?? "—"}</span>
            </div>
          </div>

          {/* Appointment Notes */}
          {appointment?.notes && (
            <div className="rounded-none border border-primary/20 bg-primary/5 p-3">
              <span className="text-[10px] font-medium uppercase tracking-wider text-primary/80">Appointment Notes</span>
              <p className="mt-1 text-sm text-foreground/80 whitespace-pre-wrap">{appointment.notes}</p>
            </div>
          )}

          {/* ── Quick action buttons: Documents & History ── */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => { setRxShowDocs((v) => !v); setRxShowHistory(false); }}
              className={cn(
                "flex items-center gap-2 rounded-none border px-3 py-2.5 text-left text-sm font-medium transition-colors",
                rxShowDocs
                  ? "border-primary/50 bg-primary/5 text-primary"
                  : "border-input text-muted-foreground hover:border-primary/30 hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <FileText className={cn("size-4", rxShowDocs ? "text-primary" : "text-muted-foreground")} />
              <span>Documents</span>
              <ChevronDown className={cn("ml-auto size-3.5 transition-transform", rxShowDocs && "rotate-180")} />
            </button>
            <button
              type="button"
              onClick={() => { setRxShowHistory((v) => !v); setRxShowDocs(false); }}
              className={cn(
                "flex items-center gap-2 rounded-none border px-3 py-2.5 text-left text-sm font-medium transition-colors",
                rxShowHistory
                  ? "border-primary/50 bg-primary/5 text-primary"
                  : "border-input text-muted-foreground hover:border-primary/30 hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <History className={cn("size-4", rxShowHistory ? "text-primary" : "text-muted-foreground")} />
              <span>Prescription History</span>
              <ChevronDown className={cn("ml-auto size-3.5 transition-transform", rxShowHistory && "rotate-180")} />
            </button>
          </div>

          {/* ── Patient Documents (collapsible) ── */}
          {rxShowDocs && appointment && (
            <div className="rounded-none border p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Patient Documents</p>
              <DocumentGallery documentableType="Patient" documentableId={appointment.patientId} />
            </div>
          )}

          {/* ── Prescription History (collapsible) ── */}
          {rxShowHistory && (
            <div className="rounded-none border p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Prescription History
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">{rxPastPrescriptions.length} records</span>
              </p>
              {rxPatientPrescriptions.isLoading ? (
                <p className="py-3 text-center text-xs text-muted-foreground">Loading...</p>
              ) : rxPastPrescriptions.length === 0 ? (
                <p className="py-3 text-center text-xs text-muted-foreground">No previous prescriptions found</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {rxPastPrescriptions.map((rx) => (
                    <div key={rx.id} className="rounded-none border-l-2 border-primary/30 bg-muted/20 px-3 py-2 text-xs">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-medium">{rx.diagnosis || "No diagnosis"}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(rx.createdAt).toLocaleDateString()}</span>
                      </div>
                      {rx.notes && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2">{rx.notes}</p>
                      )}
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {rx.items.length} medicine{rx.items.length !== 1 ? "s" : ""} · Dr. {rx.doctor?.name ?? rx.doctor?.medicalRegistrationNo ?? "Unknown"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Diagnosis */}
          <Field>
            <FieldLabel htmlFor="rx-diagnosis">Diagnosis</FieldLabel>
            <Input
              id="rx-diagnosis"
              placeholder="Optional diagnosis..."
              value={rxDiagnosis}
              onChange={(e) => setRxDiagnosis(e.target.value)}
            />
          </Field>

          {/* Doctor's Remarks */}
          <Field>
            <FieldLabel htmlFor="rx-remarks">
              Doctor's Remarks
              <span className="ml-1 text-xs font-normal text-destructive">* required</span>
            </FieldLabel>
            <textarea
              id="rx-remarks"
              rows={5}
              className={cn(
                "flex w-full rounded-none border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                !rxDoctorRemarks.trim() && "border-destructive/50 focus-visible:ring-destructive/30"
              )}
              placeholder="Enter the doctor's verbal remarks, instructions, and advice given to the patient..."
              value={rxDoctorRemarks}
              onChange={(e) => setRxDoctorRemarks(e.target.value)}
            />
            {!rxDoctorRemarks.trim() && (
              <p className="mt-1 text-xs text-destructive">Doctor's remarks are required</p>
            )}
          </Field>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={closeSheet}>Cancel</Button>
          <Button
            onClick={() => createPrescriptionMutation.mutate()}
            disabled={!rxDoctorRemarks.trim() || createPrescriptionMutation.isPending}
          >
            {createPrescriptionMutation.isPending ? "Creating..." : "Create Prescription"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}