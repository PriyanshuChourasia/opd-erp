import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Download, Eye, History, Plus, Trash2, AlertTriangle, HeartPulse, Printer } from "lucide-react";
import {
  fetchAppointment,
  fetchPatientVitalsLatest,
  fetchPrescriptions,
  fetchMedicines,
  fetchOrganisation,
  createPrescription,
  getPatientName,
  type PrescriptionItem,
} from "@/lib/api";
import { cn, printArea } from "@/lib/utils";
import { generatePaginatedRxPdf } from "@/lib/rx-export";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { hasPermission } from "@/lib/roles";
import { useAppSelector } from "@/store/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DiagnosisSelect } from "@/components/diagnosis-select";

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

  const user = useAppSelector((state) => state.auth.user);
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
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const canReadOrganisation = hasPermission(user?.permissions, "read", "company");
  const { data: organisation } = useQuery({ queryKey: ["organisation"], queryFn: fetchOrganisation, enabled: canReadOrganisation });
  const previewItems = useMemo(() => items.filter((it) => it.medicineName.trim()), [items]);
  const previewDiagnosis = diagnosis.length > 0 ? diagnosis.join(", ") : undefined;
  const previewNotes = notes.trim() || undefined;

  /**
   * Reusable chrome strips (header.png / title / computer-generated band +
   * footer.png) repeated verbatim on every PDF page. Header and footer are
   * full-bleed; only the main content carries padding.
   */
  function previewChromeHtml() {
    // Origin-qualified URLs: relative paths resolve differently inside the
    // capture iframe and break the header/footer in production deployments.
    const headerUrl = new URL('/header.png', window.location.origin).href;
    const footerUrl = new URL('/footer.png', window.location.origin).href;
    return {
      header: `<img src="${headerUrl}" alt="" style="width:100%;height:auto;display:block;margin:0;padding:0;border:0;"/>`,
      title: `<div style="background:#e8edf3;padding:10px 24px;text-align:center;border-bottom:1px solid #1e3a5f;">
    <h2 style="margin:0;font-size:16px;font-weight:bold;color:#1e3a5f;letter-spacing:2px;">MEDICAL PRESCRIPTION</h2>
  </div>`,
      footer: `<div style="box-sizing:border-box;width:100%;">
    <div style="background:#f0f2f5;padding:8px 24px;text-align:center;font-size:10px;color:#666;border-top:1px solid #ddd;">
      Computer-generated prescription preview | Generated on ${new Date().toLocaleString('en-IN')} | ${organisation?.phone ? `Phone: ${organisation.phone}` : ''} ${organisation?.email ? `| Email: ${organisation.email}` : ''}
    </div>
    <img src="${footerUrl}" alt="" style="width:100%;height:auto;display:block;margin:0;padding:0;border:0;"/>
  </div>`,
    };
  }

  /**
   * The flowing pre-save prescription content (Ref line, patient/doctor,
   * diagnosis, medicine table, notes, signature, disclaimer) — the single
   * source of truth for the paginated PDF. Kept in sync with
   * prescriptions-page.tsx's rxContentHtml so the pre-save preview matches
   * the saved prescription's exported PDF.
   */
  function previewContentHtml(): string {
    if (!appointment) return "";
    const patientName = appointment.patient ? getPatientName(appointment.patient) : "";
    const doctorName = appointment.doctor?.name ?? appointment.doctor?.medicalRegistrationNo ?? "";
    // Fixed-layout cells: long medicine names / instructions wrap instead of
    // widening the table past the A4 page.
    const wrapCell = 'vertical-align:top;overflow-wrap:anywhere;word-break:break-word;';
    const rows = (previewItems.length > 0 ? previewItems : [{ medicineId: "", medicineName: "Verbal Instructions", dosage: "As per doctor's advice", frequency: "", duration: "", quantity: 1, instructions: "" }])
      .map((item, idx) => `
      <tr>
        <td style="${wrapCell}border:1px solid #ddd;padding:6px 8px;text-align:center;font-size:11px;color:#666;width:8%;">${idx + 1}</td>
        <td style="${wrapCell}border:1px solid #ddd;padding:6px 8px;font-weight:bold;font-size:12px;width:30%;">${item.medicineName}</td>
        <td style="${wrapCell}border:1px solid #ddd;padding:6px 8px;font-size:12px;width:15%;">${item.dosage || '—'}</td>
        <td style="${wrapCell}border:1px solid #ddd;padding:6px 8px;font-size:12px;width:15%;">${[item.frequency, item.duration].filter(Boolean).join(" ") || '—'}</td>
        <td style="${wrapCell}border:1px solid #ddd;padding:6px 8px;text-align:center;font-size:12px;width:10%;">${item.quantity}</td>
        <td style="${wrapCell}border:1px solid #ddd;padding:6px 8px;font-size:11px;color:#555;width:22%;">${item.instructions || '—'}</td>
      </tr>`).join('');
    const diagnosisSection = previewDiagnosis
      ? `<div style="margin-bottom:16px;">
           <div style="font-weight:bold;color:#1e3a5f;border-bottom:1px solid #ddd;margin-bottom:6px;font-size:11px;letter-spacing:1px;padding-bottom:4px;">DIAGNOSIS</div>
           <p style="margin:0;font-size:13px;overflow-wrap:anywhere;word-break:break-word;">${previewDiagnosis}</p>
         </div>`
      : '';
    const notesSection = previewNotes
      ? `<div style="margin-bottom:16px;">
           <div style="font-weight:bold;color:#1e3a5f;border-bottom:1px solid #ddd;margin-bottom:6px;font-size:11px;letter-spacing:1px;padding-bottom:4px;">NOTES</div>
           <p style="margin:0;font-size:12px;overflow-wrap:anywhere;word-break:break-word;">${previewNotes}</p>
         </div>`
      : '';
    return `
    <div style="margin-bottom:14px;font-size:11px;color:#666;display:flex;justify-content:space-between;">
      <span>Ref: <span style="font-family:monospace;font-weight:bold;">${appointmentId.slice(0, 8).toUpperCase()}</span></span>
      <span>${[`Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, appointment.doctor?.medicalRegistrationNo ? `Reg. No: ${appointment.doctor.medicalRegistrationNo}` : ''].filter(Boolean).join(' &nbsp;|&nbsp; ')}</span>
    </div>
    <table style="width:100%;table-layout:fixed;border-collapse:collapse;margin-bottom:16px;font-size:13px;">
      <tr>
        <td style="width:50%;vertical-align:top;padding-right:12px;overflow-wrap:anywhere;word-break:break-word;">
          <div style="font-weight:bold;color:#1e3a5f;border-bottom:1px solid #ddd;margin-bottom:6px;padding-bottom:4px;font-size:11px;letter-spacing:1px;">PATIENT DETAILS</div>
          <div style="font-weight:bold;font-size:13px;margin-bottom:3px;">${patientName}</div>
          <div style="font-size:12px;color:#444;margin-bottom:2px;">Phone: ${appointment.patient?.contactNo ?? ''}</div>
          ${appointment.patient?.email ? `<div style="font-size:12px;color:#444;">Email: ${appointment.patient.email}</div>` : ''}
        </td>
        <td style="width:50%;vertical-align:top;padding-left:12px;overflow-wrap:anywhere;word-break:break-word;">
          <div style="font-weight:bold;color:#1e3a5f;border-bottom:1px solid #ddd;margin-bottom:6px;padding-bottom:4px;font-size:11px;letter-spacing:1px;">PRESCRIBED BY</div>
          <div style="font-weight:bold;font-size:13px;margin-bottom:3px;">Dr. ${doctorName}</div>
          ${appointment.doctor?.qualification ? `<div style="font-size:12px;color:#444;margin-bottom:2px;">${appointment.doctor.qualification}</div>` : ''}
          ${appointment.doctor?.specialization ? `<div style="font-size:12px;color:#444;">${appointment.doctor.specialization}</div>` : ''}
        </td>
      </tr>
    </table>
    ${diagnosisSection}
    <table class="rx-med-table" style="width:100%;table-layout:fixed;border-collapse:collapse;margin-bottom:16px;font-size:12px;">
      <thead>
        <tr style="background:#f3f4f6;">
          <th style="border:1px solid #ccc;padding:7px 8px;text-align:left;font-weight:bold;color:#1e3a5f;font-size:11px;letter-spacing:0.5px;width:8%;">SL.No.</th>
          <th style="border:1px solid #ccc;padding:7px 8px;text-align:left;font-weight:bold;color:#1e3a5f;font-size:11px;letter-spacing:0.5px;width:30%;">MEDICINE</th>
          <th style="border:1px solid #ccc;padding:7px 8px;text-align:left;font-weight:bold;color:#1e3a5f;font-size:11px;letter-spacing:0.5px;width:15%;">DOSAGE</th>
          <th style="border:1px solid #ccc;padding:7px 8px;text-align:left;font-weight:bold;color:#1e3a5f;font-size:11px;letter-spacing:0.5px;width:15%;">DURATION</th>
          <th style="border:1px solid #ccc;padding:7px 8px;text-align:left;font-weight:bold;color:#1e3a5f;font-size:11px;letter-spacing:0.5px;width:10%;">QTY</th>
          <th style="border:1px solid #ccc;padding:7px 8px;text-align:left;font-weight:bold;color:#1e3a5f;font-size:11px;letter-spacing:0.5px;width:22%;">INSTRUCTIONS</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
    ${notesSection}
    <div style="margin-top:20px;display:flex;justify-content:flex-end;">
      <div style="text-align:center;">
        <div style="width:180px;border-top:1px solid #000;margin-bottom:4px;padding-top:6px;">
          <span style="font-size:12px;font-weight:bold;">Dr. ${doctorName}</span>
        </div>
        <div style="font-size:11px;color:#666;">Doctor's Signature & Stamp</div>
      </div>
    </div>
    <div style="margin-top:16px;padding:8px 12px;background:#f8f9fa;border:1px solid #ddd;font-size:9px;color:#888;line-height:1.4;">
      This prescription is valid only for the patient named above. In case of any adverse reaction, please consult your doctor immediately. Keep this prescription for future reference.
    </div>`;
  }

  async function downloadPreviewPdf() {
    if (!appointment) return;
    setGeneratingPdf(true);
    try {
      const filename = `prescription-preview-${appointment.patient ? getPatientName(appointment.patient).replace(/\s+/g, '-') : appointmentId}.pdf`;
      // Real A4-page pagination: content is measured in an isolated render
      // frame and flowed onto fixed 794 x 1123px page elements (header.png /
      // title / padded content / footer repeated on EVERY page). Each page is
      // rasterized separately and placed on exactly one 210 x 297mm PDF page
      // — no tall-canvas slicing, so an empty trailing page can never occur.
      await generatePaginatedRxPdf({
        chrome: previewChromeHtml(),
        contentHtml: previewContentHtml(),
        filename,
      });
      toast.success('PDF downloaded successfully');
    } catch (err) {
      console.error('PDF generation failed', err);
      toast.error('Failed to generate PDF');
    } finally {
      setGeneratingPdf(false);
    }
  }

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

      {/* ── Prescription Preview Dialog ──
          Same header.png/footer.png-branded design as the saved-prescription
          preview in prescriptions-page.tsx — kept in sync deliberately, since
          this is the same document before vs. after Save. Built from local
          form state (not a saved Prescription row), so it works even before
          this prescription has ever been saved, and doesn't depend on a
          PrescriptionTemplate existing for the doctor. */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto" showCloseButton>
          <DialogHeader><DialogTitle>Prescription Preview</DialogTitle></DialogHeader>
          {appointment && (
            <div id="print-area" className="prescription-print-area flex min-h-[1123px] flex-col overflow-hidden rounded border border-gray-200 bg-white text-black text-[13px] font-[Arial,Helvetica,sans-serif]">
              {/* Header — full page width */}
              <img src="/header.png" alt="" className="block w-full h-auto shrink-0" />

              <div className="shrink-0 bg-[#e8edf3] py-2.5 px-6 text-center border-b border-[#1e3a5f]">
                <h2 className="m-0 text-sm font-bold text-[#1e3a5f] tracking-[2px]">MEDICAL PRESCRIPTION</h2>
              </div>

              {/* Body — flexes to fill, pushing the footer to the bottom */}
              <div className="min-w-0 flex-1 px-6 py-5">
                <div className="mb-3.5 flex items-center justify-between text-[11px] text-gray-500">
                  <span>Ref: <span className="font-mono font-bold">{appointmentId.slice(0, 8).toUpperCase()}</span></span>
                  <span>
                    {[
                      `Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`,
                      appointment.doctor?.medicalRegistrationNo ? `Reg. No: ${appointment.doctor.medicalRegistrationNo}` : "",
                    ].filter(Boolean).join(" | ")}
                  </span>
                </div>

                <table className="w-full border-collapse mb-4 text-[13px]">
                  <tbody>
                    <tr>
                      <td className="w-1/2 align-top pr-3">
                        <div className="font-bold text-[#1e3a5f] border-b border-gray-200 mb-1.5 pb-1 text-[11px] tracking-wide">PATIENT DETAILS</div>
                        <div className="font-bold text-[13px] mb-0.5">{appointment.patient ? getPatientName(appointment.patient) : null}</div>
                        <div className="text-xs text-gray-600 mb-0.5">Phone: {appointment.patient?.contactNo}</div>
                        {appointment.patient?.email && <div className="text-xs text-gray-600">Email: {appointment.patient.email}</div>}
                      </td>
                      <td className="w-1/2 align-top pl-3">
                        <div className="font-bold text-[#1e3a5f] border-b border-gray-200 mb-1.5 pb-1 text-[11px] tracking-wide">PRESCRIBED BY</div>
                        <div className="font-bold text-[13px] mb-0.5">Dr. {appointment.doctor?.name ?? appointment.doctor?.medicalRegistrationNo}</div>
                        {appointment.doctor?.qualification && <div className="text-xs text-gray-600 mb-0.5">{appointment.doctor.qualification}</div>}
                        {appointment.doctor?.specialization && <div className="text-xs text-gray-600">{appointment.doctor.specialization}</div>}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {previewDiagnosis && (
                  <div className="mb-4">
                    <div className="font-bold text-[#1e3a5f] border-b border-gray-200 mb-1.5 pb-1 text-[11px] tracking-wide">DIAGNOSIS</div>
                    <p className="m-0 text-[13px]">{previewDiagnosis}</p>
                  </div>
                )}

                <table className="w-full border-collapse mb-4 text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-1.5 text-left font-bold text-[#1e3a5f] text-[11px]">SL.No.</th>
                      <th className="border border-gray-300 p-1.5 text-left font-bold text-[#1e3a5f] text-[11px] w-[30%]">MEDICINE</th>
                      <th className="border border-gray-300 p-1.5 text-left font-bold text-[#1e3a5f] text-[11px] w-[15%]">DOSAGE</th>
                      <th className="border border-gray-300 p-1.5 text-left font-bold text-[#1e3a5f] text-[11px] w-[15%]">DURATION</th>
                      <th className="border border-gray-300 p-1.5 text-left font-bold text-[#1e3a5f] text-[11px] w-[10%]">QTY</th>
                      <th className="border border-gray-300 p-1.5 text-left font-bold text-[#1e3a5f] text-[11px]">INSTRUCTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(previewItems.length > 0 ? previewItems : [{ medicineName: "Verbal Instructions", dosage: "As per doctor's advice", frequency: "", duration: "", quantity: 1, instructions: "", medicineId: "" }]).map((item, idx) => (
                      <tr key={idx}>
                        <td className="border border-gray-200 p-1.5 text-center text-[11px] text-gray-500">{idx + 1}</td>
                        <td className="border border-gray-200 p-1.5 font-bold text-xs">{item.medicineName}</td>
                        <td className="border border-gray-200 p-1.5 text-xs">{item.dosage || '—'}</td>
                        <td className="border border-gray-200 p-1.5 text-xs">{[item.frequency, item.duration].filter(Boolean).join(" ") || '—'}</td>
                        <td className="border border-gray-200 p-1.5 text-center text-xs">{item.quantity}</td>
                        <td className="border border-gray-200 p-1.5 text-[11px] text-gray-600">{item.instructions || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {previewNotes && (
                  <div className="mb-4">
                    <div className="font-bold text-[#1e3a5f] border-b border-gray-200 mb-1.5 pb-1 text-[11px] tracking-wide">NOTES</div>
                    <p className="m-0 text-xs">{previewNotes}</p>
                  </div>
                )}

                <div className="flex justify-end mt-10">
                  <div className="text-center">
                    <div className="w-44 border-t border-black mb-1 pt-1.5">
                      <span className="text-xs font-bold">Dr. {appointment.doctor?.name ?? appointment.doctor?.medicalRegistrationNo}</span>
                    </div>
                    <div className="text-[11px] text-gray-600">Doctor's Signature & Stamp</div>
                  </div>
                </div>

                <div className="mt-4 p-2 bg-gray-50 border border-gray-200 text-[9px] text-gray-500 leading-relaxed">
                  This prescription is valid only for the patient named above. In case of any adverse reaction, please consult your doctor immediately. Keep this prescription for future reference.
                </div>
              </div>

              {/* Footer — pinned to the bottom of the A4 sheet */}
              <div className="mt-auto shrink-0">
                <div className="bg-gray-100 py-2 px-6 text-center text-[10px] text-gray-500 border-t border-gray-200">
                  Computer-generated prescription preview | Generated on {new Date().toLocaleString('en-IN')} | {organisation?.phone ? `Phone: ${organisation.phone}` : ''} {organisation?.email ? `| Email: ${organisation.email}` : ''}
                </div>
                <img src="/footer.png" alt="" className="block w-full h-auto" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>Close</Button>
            <Button variant="outline" onClick={printArea} disabled={!appointment} className="gap-1.5">
              <Printer className="size-3.5" />Print
            </Button>
            <Button onClick={downloadPreviewPdf} disabled={!appointment || generatingPdf} className="gap-1.5">
              <Download className="size-3.5" />{generatingPdf ? "Generating…" : "Download PDF"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
