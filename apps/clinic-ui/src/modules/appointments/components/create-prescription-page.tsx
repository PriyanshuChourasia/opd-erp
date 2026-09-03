import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Eye, History, Plus, Trash2, AlertTriangle, HeartPulse } from "lucide-react";
import {
  fetchAppointment,
  fetchPatientVitalsLatest,
  fetchPrescriptions,
  fetchMedicines,
  fetchPrescriptionTemplateForDoctor,
  createPrescription,
  getPatientName,
  type PrescriptionItem,
} from "@/lib/api";
import { cn, printArea } from "@/lib/utils";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DiagnosisSelect } from "@/components/diagnosis-select";
import { PrescriptionTemplatePreview, type PrescriptionPrintData } from "@/modules/prescription-templates/components/prescription-template-preview";

interface RxItem {
  medicineId: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions: string;
}

function emptyRxItem(): RxItem {
  return { medicineId: "", medicineName: "", dosage: "", frequency: "", duration: "", quantity: 1, instructions: "" };
}

export function CreatePrescriptionPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { appointmentId } = useParams({ from: "/_dashboard/appointments/$appointmentId/prescription" });

  const [diagnosis, setDiagnosis] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<RxItem[]>([emptyRxItem()]);
  const [showHistory, setShowHistory] = useState(false);
  const [medicineSearchIdx, setMedicineSearchIdx] = useState<number | null>(null);
  const [medicineQuery, setMedicineQuery] = useState("");

  // ── Fetch appointment ──
  const { data: appointment, isLoading: appointmentLoading } = useQuery({
    queryKey: ["appointment", appointmentId],
    queryFn: () => fetchAppointment(appointmentId),
    enabled: !!appointmentId,
  });

  // ── Fetch existing prescriptions for this patient+doctor to pre-fill ──
  const { data: existingRxResponse } = useQuery({
    queryKey: ["patient-prescriptions", appointment?.patientId, appointment?.doctorId],
    queryFn: () => fetchPrescriptions({ patientId: appointment!.patientId, doctorId: appointment!.doctorId, page: 1, limit: 1 }),
    enabled: !!appointment?.patientId && !!appointment?.doctorId,
  });
  const latestPrescription = existingRxResponse?.data?.[0] ?? null;

  // Pre-fill from appointment notes or existing prescription
  useEffect(() => {
    if (!appointment) return;
    if (latestPrescription) {
      setDiagnosis(latestPrescription.diagnosis ? latestPrescription.diagnosis.split(", ").map((d: string) => d.trim()).filter(Boolean) : []);
      setNotes(latestPrescription.notes ?? "");
      if (latestPrescription.items?.length) {
        setItems(latestPrescription.items.map((it) => ({
          medicineId: it.medicineId ?? "",
          medicineName: it.medicineName,
          dosage: it.dosage ?? "",
          frequency: "",
          duration: it.duration ?? "",
          quantity: it.quantity ?? 1,
          instructions: it.instructions ?? "",
        })));
      }
    } else if (appointment.notes) {
      setNotes(appointment.notes);
    }
  }, [appointment?.id, latestPrescription?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch vitals ──
  const { data: vitals } = useQuery({
    queryKey: ["patientVitals", "latest", appointment?.patientId],
    queryFn: () => fetchPatientVitalsLatest(appointment!.patientId),
    enabled: !!appointment?.patientId,
  });

  // ── Fetch prescription history ──
  const { data: historyResponse, isLoading: historyLoading } = useQuery({
    queryKey: ["patient-prescriptions", appointment?.patientId],
    queryFn: () => fetchPrescriptions({ patientId: appointment!.patientId, page: 1, limit: 10 }),
    enabled: !!appointment?.patientId && showHistory,
  });
  const pastPrescriptions = useMemo(() => historyResponse?.data ?? [], [historyResponse]);

  // ── Medicine search ──
  const { data: medicinesResponse } = useQuery({
    queryKey: ["medicines", "rx-search", medicineQuery],
    queryFn: () => fetchMedicines({ search: medicineQuery, limit: 10 }),
    enabled: medicineQuery.trim().length >= 1 && medicineSearchIdx !== null,
  });
  const medicineResults = useMemo(() => medicinesResponse?.data ?? [], [medicinesResponse]);

  // ── Create prescription ──
  const createMutation = useMutation({
    mutationFn: () => {
      if (!appointment) throw new Error("No appointment");
      const validItems = items.filter((it) => it.medicineName.trim());
      return createPrescription({
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        diagnosis: diagnosis.length > 0 ? diagnosis.join(", ") : undefined,
        notes: notes.trim() || undefined,
        items: validItems.length > 0 ? validItems.map((it) => ({
          medicineId: it.medicineId || "manual",
          medicineName: it.medicineName,
          dosage: it.dosage || "As directed",
          ...(it.frequency ? { duration: `${it.frequency} ${it.duration}`.trim() } : it.duration ? { duration: it.duration } : {}),
          quantity: it.quantity || 1,
          ...(it.instructions ? { instructions: it.instructions } : {}),
        })) : [{ medicineId: "manual", medicineName: "Verbal Instructions", dosage: "As per doctor's advice", quantity: 1 }],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
      toast.success("Prescription created successfully");
      navigate({ to: "/appointments" });
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const canSubmit = items.some((it) => it.medicineName.trim()) || notes.trim();

  // ── Prescription preview ──
  const [previewOpen, setPreviewOpen] = useState(false);
  const { data: template, isLoading: templateLoading } = useQuery({
    queryKey: ["prescription-template-for-doctor", appointment?.doctorId],
    queryFn: () => fetchPrescriptionTemplateForDoctor(appointment!.doctorId),
    enabled: previewOpen && !!appointment?.doctorId,
  });
  const previewData: PrescriptionPrintData | null = appointment ? {
    patient: { firstName: appointment.patient?.firstName ?? "", lastName: appointment.patient?.lastName ?? "", dateOfBirth: appointment.patient?.dateOfBirth, gender: appointment.patient?.gender },
    items: items.filter((it) => it.medicineName.trim()).map((it) => ({ medicineName: it.medicineName, dosage: it.dosage, duration: it.duration, instructions: it.instructions })),
    diagnosis: diagnosis.length > 0 ? diagnosis.join(", ") : undefined,
    notes: notes.trim() || undefined,
    date: new Date().toLocaleDateString(),
  } : null;

  function addItem() { setItems((prev) => [...prev, emptyRxItem()]); }
  function removeItem(idx: number) { setItems((prev) => prev.filter((_, i) => i !== idx)); }
  function updateItem(idx: number, field: keyof RxItem, value: string | number) {
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  }

  if (appointmentLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">Loading appointment...</p>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center">
        <p className="text-sm text-muted-foreground">Appointment not found</p>
        <Button variant="outline" onClick={() => navigate({ to: "/appointments" })}>Back</Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Edit Prescription</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {getPatientName(appointment.patient)} — {appointment.doctor?.name ?? appointment.doctor?.medicalRegistrationNo ?? "Doctor"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowHistory((v) => !v)}>
            <History className="size-4 mr-1.5" />
            History {showHistory && pastPrescriptions.length > 0 && <Badge variant="secondary" className="ml-1">{pastPrescriptions.length}</Badge>}
          </Button>
          <Button variant="outline" onClick={() => setPreviewOpen(true)}>
            <Eye className="size-4 mr-1.5" />
            Preview
          </Button>
          <Button onClick={() => createMutation.mutate()} disabled={!canSubmit || createMutation.isPending}>
            {createMutation.isPending ? "Saving..." : "Save Prescription"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Left: Patient info + Vitals ── */}
        <div className="space-y-4">
          {/* Patient Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Patient Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{getPatientName(appointment.patient)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium">{appointment.patient?.contactNo ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Doctor</span><span className="font-medium">{appointment.doctor?.name ?? appointment.doctor?.medicalRegistrationNo ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Type</span><Badge variant="outline" className="text-[10px]">{appointment.type.replace("_", " ")}</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{new Date(appointment.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span></div>
            </CardContent>
          </Card>

          {/* Vitals */}
          {vitals && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <HeartPulse className="size-4 text-rose-500" />
                  Latest Vitals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  {vitals.heightCm != null && <div><span className="text-[10px] text-muted-foreground">Height</span><p className="font-medium">{vitals.heightCm} cm</p></div>}
                  {vitals.weightKg != null && <div><span className="text-[10px] text-muted-foreground">Weight</span><p className="font-medium">{vitals.weightKg} kg</p></div>}
                  {vitals.bmi != null && <div><span className="text-[10px] text-muted-foreground">BMI</span><p className="font-medium">{vitals.bmi}</p></div>}
                  {vitals.temperatureC != null && <div><span className="text-[10px] text-muted-foreground">Temp</span><p className="font-medium">{vitals.temperatureC}°F</p></div>}
                  {vitals.pulseBpm != null && <div><span className="text-[10px] text-muted-foreground">Pulse</span><p className="font-medium">{vitals.pulseBpm} bpm</p></div>}
                  {vitals.systolicBp != null && vitals.diastolicBp != null && <div><span className="text-[10px] text-muted-foreground">BP</span><p className="font-medium">{vitals.systolicBp}/{vitals.diastolicBp}</p></div>}
                  {vitals.spo2Percent != null && <div><span className="text-[10px] text-muted-foreground">SpO₂</span><p className="font-medium">{vitals.spo2Percent}%</p></div>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Prescription History */}
          {showHistory && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Prescription History</CardTitle>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <p className="text-xs text-muted-foreground">Loading...</p>
                ) : pastPrescriptions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No previous prescriptions</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {pastPrescriptions.map((rx) => (
                      <div key={rx.id} className="rounded-none border-l-2 border-primary/30 bg-muted/20 px-3 py-2 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium">{rx.diagnosis || "No diagnosis"}</span>
                          <span className="text-[10px] text-muted-foreground">{new Date(rx.createdAt).toLocaleDateString()}</span>
                        </div>
                        {rx.notes && <p className="text-[11px] text-muted-foreground line-clamp-2">{rx.notes}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Right: Prescription form ── */}
        <div className="lg:col-span-2 space-y-4">
          {/* Appointment Notes */}
          {appointment.notes && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-primary">Appointment Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap text-foreground/80">{appointment.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Diagnosis */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Diagnosis</CardTitle>
            </CardHeader>
            <CardContent>
              <DiagnosisSelect value={diagnosis} onChange={setDiagnosis} />
            </CardContent>
          </Card>

          {/* Doctor's Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Doctor's Notes / Remarks</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                rows={4}
                className="flex w-full rounded-none border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Enter doctor's instructions, follow-up advice, lifestyle changes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </CardContent>
          </Card>

          {/* Medicine Items */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Prescribed Medicines</CardTitle>
              <Button variant="outline" size="sm" onClick={addItem}>
                <Plus className="size-3.5 mr-1" /> Add Medicine
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="rounded-none border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Medicine #{idx + 1}</span>
                    {items.length > 1 && (
                      <Button variant="ghost" size="icon-sm" className="text-destructive" onClick={() => removeItem(idx)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2 relative">
                      <Input
                        placeholder="Medicine name..."
                        value={item.medicineName}
                        onChange={(e) => {
                          updateItem(idx, "medicineName", e.target.value);
                          setMedicineQuery(e.target.value);
                          setMedicineSearchIdx(idx);
                        }}
                        onFocus={() => { setMedicineSearchIdx(idx); setMedicineQuery(item.medicineName); }}
                        onBlur={() => setTimeout(() => setMedicineSearchIdx(null), 200)}
                      />
                      {medicineSearchIdx === idx && medicineResults.length > 0 && (
                        <div className="absolute z-50 mt-1 w-full max-h-40 overflow-y-auto rounded-none border bg-popover shadow-md">
                          {medicineResults.map((med) => (
                            <button
                              key={med.id}
                              type="button"
                              className="flex w-full flex-col items-start px-3 py-1.5 text-left text-sm hover:bg-muted"
                              onMouseDown={() => {
                                updateItem(idx, "medicineId", med.id);
                                updateItem(idx, "medicineName", med.name);
                                setMedicineSearchIdx(null);
                              }}
                            >
                              <span className="font-medium">{med.name}</span>
                              {med.genericName && <span className="text-[10px] text-muted-foreground">{med.genericName}</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <Input placeholder="Dosage (e.g. 500mg)" value={item.dosage} onChange={(e) => updateItem(idx, "dosage", e.target.value)} />
                    <Input placeholder="Frequency (e.g. BD)" value={item.frequency} onChange={(e) => updateItem(idx, "frequency", e.target.value)} />
                    <Input placeholder="Duration (e.g. 7 days)" value={item.duration} onChange={(e) => updateItem(idx, "duration", e.target.value)} />
                    <Input type="number" min={1} placeholder="Qty" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 1)} />
                  </div>
                  <Input placeholder="Special instructions (optional)" value={item.instructions} onChange={(e) => updateItem(idx, "instructions", e.target.value)} />
                </div>
              ))}
              {items.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-2">No medicines added yet</p>
                  <Button variant="outline" size="sm" onClick={addItem}>
                    <Plus className="size-3.5 mr-1" /> Add Medicine
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Prescription Preview Dialog ── */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="overflow-y-auto max-h-[95vh]" style={{ maxWidth: '794px', width: '794px' }}>
          <DialogHeader><DialogTitle>Prescription Preview</DialogTitle></DialogHeader>
          {templateLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Loading template...</p>
          ) : !template ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No prescription template configured. Create one under Organisation → Rx Templates.
            </p>
          ) : previewData ? (
            <div id="print-area" className="prescription-print-area bg-white mx-auto" style={{ width: '794px', minHeight: '1123px', padding: '40px' }}>
              <PrescriptionTemplatePreview template={template} onOpenChange={() => {}} inline data={previewData} />
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>Close</Button>
            <Button onClick={printArea} disabled={!template}>
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
