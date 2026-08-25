import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation, Link } from "@tanstack/react-router";
import { getPatientName } from "@/lib/api";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { AlertTriangle, CalendarClock, ClipboardList, Download, Eye, FileText, HeartPulse, Plus, Search, X } from "lucide-react";
import * as XLSX from "xlsx";
import {
  fetchAppointments,
  updateAppointmentStatus,
  rescheduleAppointment,
  checkoutAppointment,
  fetchAppointmentInvoicePreview,
  fetchDoctors,
  fetchDoctorSlots,
  fetchUsers,
  fetchOrganisation,
  updatePatient,
  createPrescription,
  createPatientVitals,
  fetchPatientVitalsLatest,
  fetchPrescriptions,
  type Appointment,
  type AppointmentStatus,
  type BillItemInput,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DataTable } from "@/components/data-table/data-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { QueuePage } from "@/modules/queue";
import { DocumentGallery } from "@/modules/documents/components/document-viewer";
import { ChevronDown, History } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { hasPermission } from "@/lib/roles";

const APPT_STATUSES: AppointmentStatus[] = ["SCHEDULED", "CONFIRMED", "CHECKED_IN", "IN_PROGRESS", "COMPLETED", "CANCELLED", "RESCHEDULED", "NO_SHOW"];

const APPT_STATUS_STYLES: Record<string, string> = {
  SCHEDULED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  CONFIRMED: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  CHECKED_IN: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  RESCHEDULED: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  NO_SHOW: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};


/** Checked-in patients are already sitting in the live queue — label the
 *  status accordingly rather than showing the raw "CHECKED IN" wording. */
function apptStatusLabel(status: string) {
  return status === "CHECKED_IN" ? "In-Queue" : status.replace("_", " ");
}

function currency(value: number) { return `₹${value.toFixed(2)}`; }
function todayStr() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 10);
}
function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 10);
}
function localDateStr(d: Date) {
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 10);
}
function localTimeStr(d: Date) {
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(11, 16);
}


export function AppointmentsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const isReceptionist = location.pathname.startsWith('/receptionist');
  const permissions = useAppSelector((state) => state.auth.user?.permissions);
  const canReadOrganisation = hasPermission(permissions, "read", "organisation");
  const [filterDoctor, setFilterDoctor] = useState("");
  const [filterDate, setFilterDate] = useState(todayStr());
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCreator, setFilterCreator] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 100 });
  const [statusConfirm, setStatusConfirm] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [activeTab, setActiveTab] = useState<"appointments" | "queue">("appointments");
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleDoctorId, setRescheduleDoctorId] = useState("");
  const [doctorSearchQuery, setDoctorSearchQuery] = useState("");
  const [doctorSearchOpen, setDoctorSearchOpen] = useState(false);

  // ── Invoice preview ──
  const [invoicePreviewAppt, setInvoicePreviewAppt] = useState<Appointment | null>(null);
  const [invoiceDiscount, setInvoiceDiscount] = useState(0);
  const [invoiceTax, setInvoiceTax] = useState(0);
  const [invoicePaymentMethod, setInvoicePaymentMethod] = useState("CASH");

  const { data: invoicePreviewData, isLoading: invoicePreviewLoading } = useQuery({
    queryKey: ["appointment-invoice-preview", invoicePreviewAppt?.id],
    queryFn: () => fetchAppointmentInvoicePreview(invoicePreviewAppt!.id),
    enabled: !!invoicePreviewAppt,
  });

  const invoiceCheckoutMutation = useMutation({
    mutationFn: () =>
      checkoutAppointment(invoicePreviewAppt!.id, {
        discount: invoiceDiscount,
        tax: invoiceTax,
        paymentMethod: invoicePaymentMethod as "CASH" | "CARD" | "UPI",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      setInvoicePreviewAppt(null);
      toast.success("Invoice generated successfully");
    },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  // ── Vitals entry ──
  const [vitalsOpen, setVitalsOpen] = useState(false);
  const [vitalsAppointment, setVitalsAppointment] = useState<Appointment | null>(null);
  const [showVitalsForm, setShowVitalsForm] = useState(false);
  const [vitals, setVitals] = useState<Record<string, string>>({
    heightCm: "", weightCm: "", temperatureC: "", pulseBpm: "",
    systolicBp: "", diastolicBp: "", spo2Percent: "", respiratoryRate: "", medicalStatus: "",
  });

  // Latest recorded vitals for the patient whose "Vitals" sheet is open — shown
  // read-only so a previous entry isn't hidden behind an empty form.
  const { data: latestVitals, isLoading: latestVitalsLoading } = useQuery({
    queryKey: ["patientVitals", "latest", vitalsAppointment?.patientId],
    queryFn: () => fetchPatientVitalsLatest(vitalsAppointment!.patientId),
    enabled: vitalsOpen && !!vitalsAppointment?.patientId,
  });

  useEffect(() => {
    if (vitalsOpen && !latestVitalsLoading) {
      setShowVitalsForm(!latestVitals);
    }
  }, [vitalsOpen, latestVitals, latestVitalsLoading]);

  // ── Prescription creation ──
  const [rxSheetOpen, setRxSheetOpen] = useState(false);
  const [rxAppointment, setRxAppointment] = useState<Appointment | null>(null);
  const [rxDiagnosis, setRxDiagnosis] = useState("");
  const [rxDoctorRemarks, setRxDoctorRemarks] = useState("");
  const [rxShowDocs, setRxShowDocs] = useState(false);
  const [rxShowHistory, setRxShowHistory] = useState(false);

  // ── Print preview ──
  const [printAppt, setPrintAppt] = useState<Appointment | null>(null);
  const printPreviewRef = useRef<HTMLDivElement>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  async function downloadPrintPdf() {
    const element = printPreviewRef.current;
    if (!element || !printAppt) return;
    setGeneratingPdf(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const blob = await html2pdf()
        .set({
          margin: [0.5, 0.5, 0.5, 0.5],
          filename: `appointment-${getPatientName(printAppt.patient!).replace(/\s+/g, "-") ?? printAppt.id}.pdf`,
          image: { type: "jpeg", quality: 0.95 },
          html2canvas: { scale: 2, letterRendering: true, useCORS: true },
          jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
        })
        .from(element)
        .outputPdf("blob");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `appointment-${getPatientName(printAppt.patient!).replace(/\s+/g, "-") ?? printAppt.id}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (err) {
      console.error("PDF generation failed", err);
      toast.error("Failed to generate PDF");
    } finally {
      setGeneratingPdf(false);
    }
  }

  function browserPrint() {
    const el = printPreviewRef.current;
    if (!el) return;
    const w = window.open("", "_blank");
    if (!w) return;
    const html = "<!DOCTYPE html><html><head><title>Print</title><style>@media print{body{margin:0}}</style></head><body>" + el.outerHTML + "</body></html>";
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  }

  // ── Export to Excel ──
  function exportToExcel() {
    const rows = (appointmentsResponse?.data ?? []).map((appt) => ({
      "Patient Name": `${appt.patient.firstName} ${appt.patient.lastName}`,
      "Phone": appt.patient.contactNo ?? "",
      "Doctor": appt.doctor.name ?? appt.doctor.medicalRegistrationNo ?? "",
      "Specialization": appt.doctor.specialization ?? "",
      "Date": appt.date ? new Date(appt.date).toLocaleDateString() : "",
      "Type": appt.type ?? "",
      "Status": appt.status,
      "Fee": appt.fee ?? 0,
      "Registration Fee": appt.registrationFee ?? 0,
      "Token": appt.tokenNumber ?? "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Appointments");
    XLSX.writeFile(wb, `appointments_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  // ── Export to PDF ──
  async function exportToPdf() {
    const rows = appointmentsResponse?.data ?? [];
    if (rows.length === 0) return;
    const htmlContent = `
      <html><head><style>
        body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }
        h2 { text-align: center; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
        th { background: #f3f4f6; font-weight: bold; }
        tr:nth-child(even) { background: #f9fafb; }
      </style></head><body>
      <h2>Appointments Report — ${filterDate || 'All Dates'}</h2>
      <table>
        <thead><tr>
          <th>#</th><th>Patient</th><th>Phone</th><th>Doctor</th><th>Specialization</th>
          <th>Date</th><th>Type</th><th>Status</th><th>Fee</th><th>Token</th>
        </tr></thead>
        <tbody>
          ${rows.map((appt, i) => `<tr>
            <td>${i + 1}</td>
            <td>${appt.patient.firstName} ${appt.patient.lastName}</td>
            <td>${appt.patient.contactNo ?? ''}</td>
            <td>${appt.doctor.name ?? appt.doctor.medicalRegistrationNo ?? ''}</td>
            <td>${appt.doctor.specialization ?? ''}</td>
            <td>${appt.date ? new Date(appt.date).toLocaleDateString() : ''}</td>
            <td>${appt.type ?? ''}</td>
            <td>${appt.status}</td>
            <td>${appt.fee ?? 0}</td>
            <td>${appt.tokenNumber ?? ''}</td>
          </tr>`).join('')}
        </tbody>
      </table>
      </body></html>`;
    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    document.body.appendChild(element);
    const html2pdf = (await import('html2pdf.js')).default;
    await html2pdf().set({
      margin: 0.5,
      filename: `appointments_${new Date().toISOString().slice(0, 10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' },
    }).from(element).save();
    document.body.removeChild(element);
  }

  const { data: doctorsResponse } = useQuery({
    queryKey: ["doctors", "appointments-filter"],
    queryFn: () => fetchDoctors({ limit: 100 }),
  });
  const doctors = useMemo(() => doctorsResponse?.data ?? [], [doctorsResponse]);

  const { data: usersResponse } = useQuery({
    queryKey: ["users", "appointments-filter"],
    queryFn: () => fetchUsers({ limit: 100 }),
  });
  const users = useMemo(() => usersResponse?.data ?? [], [usersResponse]);

  const { data: organisation } = useQuery({ queryKey: ["organisation"], queryFn: fetchOrganisation, enabled: canReadOrganisation });

  // ── Prescriptions lookup (for showing doctor notes on appointment rows) ──
  const { data: prescriptionsResponse } = useQuery({
    queryKey: ["prescriptions", "appt-notes-lookup"],
    queryFn: () => fetchPrescriptions({ limit: 500 }),
  });
  const prescriptionNotesMap = useMemo(() => {
    const map = new Map<string, { notes: string; date: string }>();
    for (const rx of prescriptionsResponse?.data ?? []) {
      if (!rx.notes) continue;
      const key = `${rx.patientId}:${rx.doctorId}`;
      const existing = map.get(key);
      if (!existing || new Date(rx.createdAt) > new Date(existing.date)) {
        map.set(key, { notes: rx.notes, date: rx.createdAt });
      }
    }
    // Strip the date helper — only keep notes
    const notesOnly = new Map<string, string>();
    for (const [k, v] of map) notesOnly.set(k, v.notes);
    return notesOnly;
  }, [prescriptionsResponse]);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPagination((p) => ({ ...p, pageIndex: 0 }));
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: appointmentsResponse, isLoading } = useQuery({
    queryKey: ["appointments", filterDoctor, filterDate, filterStatus, filterCreator, search, pagination.pageIndex, pagination.pageSize],
    queryFn: () => fetchAppointments({
      doctorId: filterDoctor || undefined,
      date: search ? undefined : (filterDate || undefined),
      status: filterStatus || undefined,
      createdById: filterCreator || undefined,
      search: search || undefined,
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
    }),
    placeholderData: (previous) => previous,
  });
  const appointments = useMemo(() => appointmentsResponse?.data ?? [], [appointmentsResponse]);
  const pageCount = appointmentsResponse?.meta?.totalPages ?? 0;

  const statusMutation = useMutation({
    mutationFn: ({ id, status, cancellationReason }: { id: string; status: AppointmentStatus; cancellationReason?: string }) =>
      updateAppointmentStatus(id, status, cancellationReason),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["appointments"] }); setStatusConfirm(null); setCancelReason(""); toast.success("Appointment status updated"); },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  const followUpMutation = useMutation({
    mutationFn: ({ id, isFollowUp }: { id: string; isFollowUp: boolean }) => updatePatient(id, { isFollowUp }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["appointment-patients"] }); },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  const rxPatientPrescriptions = useQuery({
    queryKey: ["patient-prescriptions", rxAppointment?.patientId],
    queryFn: () => fetchPrescriptions({ patientId: rxAppointment!.patientId, page: 1, limit: 10 }),
    enabled: !!rxAppointment?.patientId && rxShowHistory,
  });
  const rxPastPrescriptions = useMemo(() => rxPatientPrescriptions.data?.data ?? [], [rxPatientPrescriptions.data]);

  const createPrescriptionMutation = useMutation({
    mutationFn: () => {
      if (!rxAppointment) throw new Error("No appointment selected");
      return createPrescription({
        patientId: rxAppointment.patientId,
        doctorId: rxAppointment.doctorId,
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
      setRxSheetOpen(false);
      setRxAppointment(null);
      setRxDiagnosis("");
      setRxDoctorRemarks("");
      toast.success("Prescription created with doctor's remarks");
    },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  // ── Vitals mutation ──
  const vitalsMutation = useMutation({
    mutationFn: async () => {
      if (!vitalsAppointment) return;
      const payload: Record<string, string | number> = { patientId: vitalsAppointment.patientId, appointmentId: vitalsAppointment.id };
      if (vitals.heightCm) payload.heightCm = parseFloat(vitals.heightCm);
      if (vitals.weightCm) payload.weightKg = parseFloat(vitals.weightCm);
      if (vitals.temperatureC) payload.temperatureC = parseFloat(vitals.temperatureC);
      if (vitals.pulseBpm) payload.pulseBpm = parseInt(vitals.pulseBpm, 10);
      if (vitals.systolicBp) payload.systolicBp = parseInt(vitals.systolicBp, 10);
      if (vitals.diastolicBp) payload.diastolicBp = parseInt(vitals.diastolicBp, 10);
      if (vitals.spo2Percent) payload.spo2Percent = parseFloat(vitals.spo2Percent);      if (vitals.respiratoryRate) payload.respiratoryRate = parseInt(vitals.respiratoryRate, 10);
      if (vitals.medicalStatus) payload.medicalStatus = vitals.medicalStatus;
      await createPatientVitals(payload as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patientVitals"] });

      toast.success("Vitals recorded successfully");
      setVitalsOpen(false);
      setVitalsAppointment(null);
      setShowVitalsForm(false);
      setVitals({ heightCm: "", weightCm: "", temperatureC: "", pulseBpm: "", systolicBp: "", diastolicBp: "", spo2Percent: "", respiratoryRate: "", medicalStatus: "" });
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  function openVitals(appt: Appointment) {
    setVitalsAppointment(appt);
    setVitals({ heightCm: "", weightCm: "", temperatureC: "", pulseBpm: "", systolicBp: "", diastolicBp: "", spo2Percent: "", respiratoryRate: "" });
    setShowVitalsForm(false);
    setVitalsOpen(true);
  }

  function openReschedule(appt: Appointment) {
    const d = new Date(appt.date);
    setRescheduleTarget(appt);
    setRescheduleDate(localDateStr(d));
    setRescheduleTime(localTimeStr(d));
    setRescheduleDoctorId(appt.doctorId);
  }

  const rescheduleSlotsQuery = useQuery({
    queryKey: ["doctor-slots", "reschedule", rescheduleDoctorId, rescheduleDate],
    queryFn: () => fetchDoctorSlots(rescheduleDoctorId, rescheduleDate),
    enabled: !!rescheduleDoctorId && !!rescheduleDate,
  });

  const rescheduleMutation = useMutation({
    mutationFn: () =>
      rescheduleAppointment(rescheduleTarget!.id, {
        date: `${rescheduleDate}T${rescheduleTime}:00`,
        doctorId: rescheduleDoctorId || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      setRescheduleTarget(null);
      toast.success("Appointment rescheduled");
    },
    onError: (err) => { toast.error(extractApiError(err)); },
  });


  function setFilterDoctorAndResetPage(id: string) {
    setFilterDoctor(id);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }
  function setFilterDateAndResetPage(date: string) {
    setFilterDate(date);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }
  function setFilterStatusAndResetPage(status: string) {
    setFilterStatus(status);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }
  function setFilterCreatorAndResetPage(creatorId: string) {
    setFilterCreator(creatorId);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }

  const columns = useMemo<ColumnDef<Appointment>[]>(() => [    {
      id: "token",
      header: () => <div className="text-center">Token #</div>,
      cell: ({ row }) => (
        <div className="text-center text-sm font-semibold text-muted-foreground">
          {row.original.tokenNumber ? `#${row.original.tokenNumber}` : "—"}
        </div>
      ),
    },
    {
      id: "patient",
      header: () => <div className="text-center">Patient</div>,
      cell: ({ row }) => {
        const appt = row.original;
        const rxNotes = prescriptionNotesMap.get(`${appt.patientId}:${appt.doctorId}`);
        return (
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{appt.patient ? getPatientName(appt.patient) : null}</p>
            <p className="text-xs text-muted-foreground">{appt.patient?.contactNo}</p>
            {rxNotes && (
              <p className="mt-0.5 text-[11px] text-blue-600 dark:text-blue-400 line-clamp-2 italic" title={rxNotes}>
                {rxNotes}
              </p>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => (
        <div className="text-center"><Badge variant="outline" className={`text-[10px] ${APPT_STATUS_STYLES[row.original.status] ?? ""}`}>
          {apptStatusLabel(row.original.status)}
        </Badge></div>
      ),
    },
    {
      id: "doctor",
      header: () => <div className="text-center">Doctor</div>,
      cell: ({ row }) => <div className="text-center text-sm">{row.original.doctor?.name ?? row.original.doctor?.medicalRegistrationNo ?? 'Doctor'}</div>,
    },
    {
      accessorKey: "type",
      header: () => <div className="text-center">Type</div>,
      cell: ({ row }) => <div className="text-center text-sm text-muted-foreground">{row.original.type.replace("_", " ")}</div>,
    },
    {
      id: "time",
      header: () => <div className="text-center">Time</div>,
      cell: ({ row }) => (
        <div className="text-center text-sm text-muted-foreground">
          {new Date(row.original.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      ),
    },
    {
      accessorKey: "fee",
      header: () => <div className="text-center">Fee</div>,
      cell: ({ row }) => <div className="text-center text-sm font-medium">{currency(row.original.fee)}</div>,
    },
    {
      id: "actions",
      header: () => <div className="text-center">Action</div>,
      cell: ({ row }) => {
        const appt = row.original;
        return (
          <div className="flex items-center justify-center gap-1">
            <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-9" aria-label="View or edit appointment" onClick={() => navigate({ to: "/appointments/$appointmentId/edit", params: { appointmentId: appt.id } })}>
                  <Eye className="size-4.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View / Edit</TooltipContent>
            </Tooltip>
            {appt.status !== "CANCELLED" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-9" aria-label="View or record patient vitals" onClick={() => openVitals(appt)}>
                    <HeartPulse className="size-4.5 text-rose-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Vitals</TooltipContent>
              </Tooltip>
            )}
            {appt.status === "COMPLETED" && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-9" aria-label="Create prescription with doctor's remarks" onClick={() => {
                      setRxAppointment(appt);
                      setRxDiagnosis("");
                      setRxDoctorRemarks("");

                      setRxSheetOpen(true);
                    }}>
                      <ClipboardList className="size-4.5 text-indigo-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Create Prescription</TooltipContent>
                </Tooltip>
                {appt.bill ? (
                  <Badge variant="outline" className="text-[10px] bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                    Paid
                  </Badge>
                ) : (
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-[10px] bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                      Unpaid
                    </Badge>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-9" aria-label="Generate invoice" onClick={() => {
                          setInvoicePreviewAppt(appt);
                          setInvoiceDiscount(0);
                          setInvoiceTax(0);
                          setInvoicePaymentMethod("CASH");
                        }}>
                          <FileText className="size-4.5 text-green-600" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Generate Invoice</TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </>
            )}
            {appt.status === "COMPLETED" ? null : statusConfirm === appt.id ? (
              <div className="flex items-center gap-1">
                <Input
                  autoFocus
                  placeholder="Reason *"
                  className="h-8 w-36 text-xs"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && cancelReason.trim()) statusMutation.mutate({ id: appt.id, status: "CANCELLED", cancellationReason: cancelReason.trim() }); }}
                />
                <Button variant="destructive" size="sm" className="h-8 text-xs" disabled={!cancelReason.trim()} onClick={() => statusMutation.mutate({ id: appt.id, status: "CANCELLED", cancellationReason: cancelReason.trim() })}>Cancel</Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-9" aria-label="Dismiss cancellation" onClick={() => { setStatusConfirm(null); setCancelReason(""); }}><X className="size-3.5" /></Button>
                  </TooltipTrigger>
                  <TooltipContent>Dismiss</TooltipContent>
                </Tooltip>
              </div>
            ) : (
              <Select
                value={appt.status}
                onValueChange={(value) => {
                  if (value === appt.status) return;
                  if (value === "CANCELLED") { setStatusConfirm(appt.id); return; }
                  if (value === "RESCHEDULED") { openReschedule(appt); return; }
                  statusMutation.mutate({ id: appt.id, status: value as AppointmentStatus }, {
                    onSuccess: () => {
                      if (value === "CHECKED_IN") queryClient.invalidateQueries({ queryKey: ["queue"] });
                    },
                  });
                }}
              >
                <SelectTrigger size="sm" className="h-8 text-xs" aria-label="Change appointment status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APPT_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>{apptStatusLabel(status)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            </TooltipProvider>
          </div>
        );
      },
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [statusConfirm, cancelReason]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Appointment & Queue</h1>
        </div>
        <div className="flex items-center gap-2">
          {!isReceptionist && (
            <Button asChild>
              <Link to="/appointments/new">
                <Plus className="mr-2 size-4" />
                Book Appointment
              </Link>
            </Button>
          )}

          <div className="flex items-center gap-1.5">
            <Button variant={!search && !filterDate ? "default" : "outline"} size="sm" onClick={() => setFilterDateAndResetPage("")}>All</Button>
            <Button variant={filterDate === todayStr() ? "default" : "outline"} size="sm" onClick={() => setFilterDateAndResetPage(todayStr())}>Today</Button>
            <Button variant={filterDate === tomorrowStr() ? "default" : "outline"} size="sm" onClick={() => setFilterDateAndResetPage(tomorrowStr())}>Tomorrow</Button>
            <Input
              type="date"
              className="w-auto"
              value={filterDate}
              onChange={(e) => setFilterDateAndResetPage(e.target.value)}
            />
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "appointments" | "queue")}>
        <TabsList>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="queue">Queue</TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="space-y-4 mt-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search patient name, phone, or token #" className="w-64 pl-9" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        </div>
        <div className="relative">
          {filterDoctor ? (
            <div className="flex h-9 items-center justify-between rounded-none border border-input bg-background px-3 text-sm">
              <span className="truncate">{doctors.find((d) => d.id === filterDoctor)?.name ?? doctors.find((d) => d.id === filterDoctor)?.medicalRegistrationNo ?? 'Doctor'}</span>
              <button type="button" className="ml-2 shrink-0 text-muted-foreground hover:text-foreground" title="Clear doctor filter" onClick={() => setFilterDoctorAndResetPage("")}>
                <X className="size-4.5" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search doctor..."
                className="flex h-9 w-48 rounded-none border border-input bg-background pl-9 pr-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={doctorSearchQuery || ""}
                onChange={(e) => {
                  setDoctorSearchQuery(e.target.value);
                  setDoctorSearchOpen(true);
                }}
                onFocus={() => setDoctorSearchOpen(true)}
                onBlur={() => setTimeout(() => setDoctorSearchOpen(false), 200)}
              />
              {doctorSearchOpen && (doctorSearchQuery || "").trim().length >= 0 && (
                <div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-none border bg-popover shadow-md">
                  {doctors
                    .filter((d) =>
                      !(doctorSearchQuery || "").trim() ||
                      (d.name ?? d.medicalRegistrationNo ?? "").toLowerCase().includes((doctorSearchQuery || "").trim().toLowerCase()) ||
                      (d.specialization ?? "").toLowerCase().includes((doctorSearchQuery || "").trim().toLowerCase())
                    )
                    .map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-muted"
                        onMouseDown={() => {
                          setFilterDoctorAndResetPage(d.id);
                          setDoctorSearchQuery("");
                          setDoctorSearchOpen(false);
                        }}
                      >
                        <span className="font-medium">{d.name ?? d.medicalRegistrationNo ?? 'Doctor'}</span>
                        {d.specialization && <span className="text-xs text-muted-foreground">{d.specialization}</span>}
                      </button>
                    ))}
                  {doctors.filter((d) =>
                    !(doctorSearchQuery || "").trim() ||
                    (d.name ?? d.medicalRegistrationNo ?? "").toLowerCase().includes((doctorSearchQuery || "").trim().toLowerCase()) ||
                    (d.specialization ?? "").toLowerCase().includes((doctorSearchQuery || "").trim().toLowerCase())
                  ).length === 0 && (
                    <p className="p-3 text-center text-sm text-muted-foreground">No doctors found</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <select
          className="flex h-9 rounded-none border border-input bg-background px-3 py-1 text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatusAndResetPage(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CHECKED_IN">In-Queue</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="RESCHEDULED">Rescheduled</option>
          <option value="NO_SHOW">No Show</option>
        </select>
        <select
          className="flex h-9 rounded-none border border-input bg-background px-3 py-1 text-sm"
          value={filterCreator}
          onChange={(e) => setFilterCreatorAndResetPage(e.target.value)}
        >
          <option value="">All employees</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
          ))}
        </select>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportToExcel} disabled={!appointments.length}>
            <Download className="mr-1.5 size-3.5" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={exportToPdf} disabled={!appointments.length}>
            <Download className="mr-1.5 size-3.5" />
            PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Appointments</CardTitle></CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={appointments}
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={setPagination}
            isLoading={isLoading}
            emptyState={
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <CalendarClock className="size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No appointments for this day</p>
              </div>
            }
          />
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="queue">
          <QueuePage />
        </TabsContent>
      </Tabs>

      <Sheet open={!!rescheduleTarget} onOpenChange={(open) => { if (!open) setRescheduleTarget(null); }}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Reschedule Appointment</SheetTitle>
            <SheetDescription>{rescheduleTarget?.patient ? getPatientName(rescheduleTarget.patient) : null} — pick a new date, doctor, and slot.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-4 px-4 pb-4">
            <Field><FieldLabel htmlFor="r-date">Date</FieldLabel>
              <Input id="r-date" type="date" value={rescheduleDate} onChange={(e) => { setRescheduleDate(e.target.value); setRescheduleTime(""); }} />
            </Field>
            <Field><FieldLabel htmlFor="r-doctor">Doctor</FieldLabel>
              <select
                id="r-doctor"
                className="flex h-9 w-full rounded-none border border-input bg-background px-3 py-1 text-sm"
                value={rescheduleDoctorId}
                onChange={(e) => { setRescheduleDoctorId(e.target.value); setRescheduleTime(""); }}
              >
                <option value="">Select a doctor...</option>
                {doctors.map((d) => (<option key={d.id} value={d.id}>{d.name ?? d.medicalRegistrationNo ?? 'Doctor'}</option>))}
              </select>
            </Field>
            {rescheduleDoctorId && rescheduleDate && (
              <Field><FieldLabel>Slot</FieldLabel>
                {rescheduleSlotsQuery.isLoading ? (<p className="text-sm text-muted-foreground">Loading slots...</p>) : !rescheduleSlotsQuery.data?.available ? (<p className="text-sm text-muted-foreground">No slots available for this day.</p>) : (
                  <div className="grid grid-cols-4 gap-2">
                    {rescheduleSlotsQuery.data.slots.map((s) => (
                      <button key={s.time} type="button" disabled={!s.available} className={cn("rounded-none border px-2 py-1.5 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40", rescheduleTime === s.time ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground")} onClick={() => setRescheduleTime(s.time)}>
                        {s.time}
                      </button>
                    ))}
                  </div>
                )}
              </Field>
            )}
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setRescheduleTarget(null)}>Cancel</Button>
            <Button
              onClick={() => rescheduleMutation.mutate()}
              disabled={!rescheduleDate || !rescheduleDoctorId || !rescheduleTime || rescheduleMutation.isPending}
            >
              {rescheduleMutation.isPending ? "Rescheduling..." : "Reschedule"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Invoice Preview Sheet ── */}
      <Sheet open={!!invoicePreviewAppt} onOpenChange={(open) => { if (!open) { setInvoicePreviewAppt(null); } }}>
        <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Invoice Preview</SheetTitle>
            <SheetDescription>
              {invoicePreviewAppt ? `Review invoice for ${invoicePreviewAppt.patient ? getPatientName(invoicePreviewAppt.patient) : ""}` : ""}
            </SheetDescription>
          </SheetHeader>

          {invoicePreviewLoading ? (
            <div className="flex-1 px-4 pb-4">
              <p className="text-sm text-muted-foreground">Loading preview...</p>
            </div>
          ) : invoicePreviewData ? (
            <div className="flex-1 space-y-4 px-4 pb-4">
              {/* Patient & Doctor info */}
              <div className="rounded-none border bg-muted/20 p-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Patient</span>
                  <span className="font-medium">{invoicePreviewAppt?.patient ? getPatientName(invoicePreviewAppt.patient) : "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Doctor</span>
                  <span className="font-medium">{invoicePreviewAppt?.doctor?.name ?? invoicePreviewAppt?.doctor?.medicalRegistrationNo ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</span>
                  <span className="font-medium">{invoicePreviewAppt ? new Date(invoicePreviewAppt.date).toLocaleDateString() : "—"}</span>
                </div>
              </div>

              {/* Line items */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Line Items</p>
                <div className="space-y-1.5">
                  {invoicePreviewData.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between rounded-none border px-3 py-2 text-sm">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{item.itemName}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity ?? 1} × {currency(item.unitPrice)}
                        </p>
                      </div>
                      <span className="ml-3 shrink-0 font-medium">
                        {currency((item.quantity ?? 1) * item.unitPrice)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-1.5 border-t pt-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">
                    {currency(invoicePreviewData.items.reduce((sum, item) => sum + (item.quantity ?? 1) * item.unitPrice, 0))}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-medium text-destructive">-{currency(invoiceDiscount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium">+{currency(invoiceTax)}</span>
                </div>
                <div className="flex items-center justify-between border-t pt-1.5 text-base font-semibold">
                  <span>Total</span>
                  <span>
                    {currency(
                      invoicePreviewData.items.reduce((sum, item) => sum + (item.quantity ?? 1) * item.unitPrice, 0) -
                        invoiceDiscount +
                        invoiceTax,
                    )}
                  </span>
                </div>
              </div>

              {/* Discount & Tax inputs */}
              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="inv-discount">Discount (₹)</FieldLabel>
                  <Input
                    id="inv-discount"
                    type="number"
                    min={0}
                    value={invoiceDiscount}
                    onChange={(e) => setInvoiceDiscount(Math.max(0, Number(e.target.value) || 0))}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="inv-tax">Tax (₹)</FieldLabel>
                  <Input
                    id="inv-tax"
                    type="number"
                    min={0}
                    value={invoiceTax}
                    onChange={(e) => setInvoiceTax(Math.max(0, Number(e.target.value) || 0))}
                  />
                </Field>
              </div>

              {/* Payment method */}
              <Field>
                <FieldLabel htmlFor="inv-payment">Payment Method</FieldLabel>
                <select
                  id="inv-payment"
                  className="flex h-9 w-full rounded-none border border-input bg-background px-3 py-1 text-sm"
                  value={invoicePaymentMethod}
                  onChange={(e) => setInvoicePaymentMethod(e.target.value)}
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="UPI">UPI</option>
                </select>
              </Field>
            </div>
          ) : null}

          <SheetFooter>
            <Button variant="outline" onClick={() => setInvoicePreviewAppt(null)}>Cancel</Button>
            <Button
              onClick={() => invoiceCheckoutMutation.mutate()}
              disabled={!invoicePreviewData || invoiceCheckoutMutation.isPending}
            >
              {invoiceCheckoutMutation.isPending ? "Generating..." : "Generate Invoice"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Create Prescription Sheet ── */}
      <Sheet open={rxSheetOpen} onOpenChange={(open) => { if (!open) { setRxSheetOpen(false); setRxAppointment(null); setRxShowDocs(false); setRxShowHistory(false); } }}>
        <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create Prescription</SheetTitle>
            <SheetDescription>
              {rxAppointment ? `Record doctor's remarks for ${rxAppointment.patient ? getPatientName(rxAppointment.patient) : ""}` : ""}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-4 px-4 pb-4">
            {/* Patient & Doctor info */}
            <div className="rounded-none border bg-muted/20 p-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Patient</span>
                <span className="font-medium">{rxAppointment?.patient ? getPatientName(rxAppointment.patient) : "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Doctor</span>
                <span className="font-medium">{rxAppointment?.doctor?.name ?? rxAppointment?.doctor?.medicalRegistrationNo ?? "—"}</span>
              </div>
            </div>

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
            {rxShowDocs && rxAppointment && (
              <div className="rounded-none border p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Patient Documents</p>
                <DocumentGallery documentableType="Patient" documentableId={rxAppointment.patientId} />
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
            <Button variant="outline" onClick={() => { setRxSheetOpen(false); setRxAppointment(null); setRxShowDocs(false); setRxShowHistory(false); }}>Cancel</Button>
            <Button
              onClick={() => createPrescriptionMutation.mutate()}
              disabled={!rxDoctorRemarks.trim() || createPrescriptionMutation.isPending}
            >
              {createPrescriptionMutation.isPending ? "Creating..." : "Create Prescription"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Vitals Sheet ── */}
      <Sheet open={vitalsOpen} onOpenChange={(open) => { if (!open) { setVitalsOpen(false); setVitalsAppointment(null); setShowVitalsForm(false); } }}>
        <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <HeartPulse className="size-5 text-rose-500" />
              {showVitalsForm ? "Record Vitals" : "Patient Vitals"}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4 px-4 py-4">
            {vitalsAppointment && (
              <div className="rounded-none border bg-muted/20 p-3 text-sm">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Patient</span>
                <p className="mt-0.5 font-medium">{vitalsAppointment.patient ? getPatientName(vitalsAppointment.patient) : "—"}</p>
                <p className="text-xs text-muted-foreground">{vitalsAppointment.patient?.contactNo}</p>
              </div>
            )}

            {latestVitalsLoading && (
              <p className="text-xs text-muted-foreground">Loading vitals…</p>
            )}

            {!showVitalsForm && latestVitals && (
              <div className="rounded-none border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Last recorded vitals</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(latestVitals.recordedAt).toLocaleString()}</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                  {latestVitals.heightCm != null && (
                    <div><span className="text-[10px] text-muted-foreground">Height</span><p className="font-medium">{latestVitals.heightCm} cm</p></div>
                  )}
                  {latestVitals.weightKg != null && (
                    <div><span className="text-[10px] text-muted-foreground">Weight</span><p className="font-medium">{latestVitals.weightKg} kg</p></div>
                  )}
                  {latestVitals.bmi != null && (
                    <div><span className="text-[10px] text-muted-foreground">BMI</span><p className="font-medium">{latestVitals.bmi}</p></div>
                  )}
                  {latestVitals.temperatureC != null && (
                    <div><span className="text-[10px] text-muted-foreground">Temp</span><p className="font-medium">{latestVitals.temperatureC}°F</p></div>
                  )}
                  {latestVitals.pulseBpm != null && (
                    <div><span className="text-[10px] text-muted-foreground">Pulse</span><p className="font-medium">{latestVitals.pulseBpm} bpm</p></div>
                  )}
                  {latestVitals.systolicBp != null && latestVitals.diastolicBp != null && (
                    <div><span className="text-[10px] text-muted-foreground">BP</span><p className="font-medium">{latestVitals.systolicBp}/{latestVitals.diastolicBp} mmHg</p></div>
                  )}
                  {latestVitals.spo2Percent != null && (
                    <div><span className="text-[10px] text-muted-foreground">SpO₂</span><p className="font-medium">{latestVitals.spo2Percent}%</p></div>
                  )}
                  {latestVitals.respiratoryRate != null && (
                    <div><span className="text-[10px] text-muted-foreground">Resp Rate</span><p className="font-medium">{latestVitals.respiratoryRate}/min</p></div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() => setShowVitalsForm(true)}
                >
                  <Plus className="size-3.5" /> Add New Vitals
                </Button>
              </div>
            )}

            {showVitalsForm && (
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel className="text-[10px]">Height (cm)</FieldLabel>
                <Input className="h-8 text-xs" type="number" placeholder="170" value={vitals.heightCm} onChange={(e) => setVitals((v) => ({ ...v, heightCm: e.target.value }))} />
              </Field>
              <Field>
                <FieldLabel className="text-[10px]">Weight (kg)</FieldLabel>
                <Input className="h-8 text-xs" type="number" placeholder="70" value={vitals.weightCm} onChange={(e) => setVitals((v) => ({ ...v, weightCm: e.target.value }))} />
              </Field>
              <Field>
                <FieldLabel className="text-[10px]">Temperature (°F)</FieldLabel>
                <Input className="h-8 text-xs" type="number" step="0.1" placeholder="98.6" value={vitals.temperatureC} onChange={(e) => setVitals((v) => ({ ...v, temperatureC: e.target.value }))} />
              </Field>
              <Field>
                <FieldLabel className="text-[10px]">Pulse (bpm)</FieldLabel>
                <Input className="h-8 text-xs" type="number" placeholder="72" value={vitals.pulseBpm} onChange={(e) => setVitals((v) => ({ ...v, pulseBpm: e.target.value }))} />
              </Field>
              <Field>
                <FieldLabel className="text-[10px]">Systolic BP</FieldLabel>
                <Input className="h-8 text-xs" type="number" placeholder="120" value={vitals.systolicBp} onChange={(e) => setVitals((v) => ({ ...v, systolicBp: e.target.value }))} />
              </Field>
              <Field>
                <FieldLabel className="text-[10px]">Diastolic BP</FieldLabel>
                <Input className="h-8 text-xs" type="number" placeholder="80" value={vitals.diastolicBp} onChange={(e) => setVitals((v) => ({ ...v, diastolicBp: e.target.value }))} />
              </Field>
              <Field>
                <FieldLabel className="text-[10px]">SpO₂ (%)</FieldLabel>
                <Input className="h-8 text-xs" type="number" placeholder="98" value={vitals.spo2Percent} onChange={(e) => setVitals((v) => ({ ...v, spo2Percent: e.target.value }))} />
              </Field>
              <Field>
                <FieldLabel className="text-[10px]">Resp. Rate (/min)</FieldLabel>
                <Input className="h-8 text-xs" type="number" placeholder="16" value={vitals.respiratoryRate} onChange={(e) => setVitals((v) => ({ ...v, respiratoryRate: e.target.value }))} />
              </Field>
              <Field className="col-span-2">
                <FieldLabel className="text-[10px]">Medical Status</FieldLabel>
                <select
                  className="flex h-8 w-full rounded-none border border-input bg-background px-2 text-xs"
                  value={vitals.medicalStatus}
                  onChange={(e) => setVitals((v) => ({ ...v, medicalStatus: e.target.value }))}
                >
                  <option value="">Select status...</option>
                  <option value="Before Fasting">Before Fasting</option>
                  <option value="After Fasting">After Fasting</option>
                  <option value="Before Meals">Before Meals</option>
                  <option value="After Meals">After Meals</option>
                  <option value="Before Sleep">Before Sleep</option>
                  <option value="After Waking Up">After Waking Up</option>
                  <option value="After Exercise">After Exercise</option>
                  <option value="At Rest">At Rest</option>
                  <option value="During Stress">During Stress</option>
                  <option value="Before Medication">Before Medication</option>
                  <option value="After Medication">After Medication</option>
                  <option value="During Menstruation">During Menstruation</option>
                  <option value="Pregnancy">Pregnancy</option>
                  <option value="Post Surgery">Post Surgery</option>
                  <option value="Other">Other</option>
                </select>
              </Field>
            </div>
            )}

            {!showVitalsForm && !latestVitalsLoading && !latestVitals && (
              <p className="text-xs text-muted-foreground">No vitals recorded yet for this patient.</p>
            )}
          </div>
          <SheetFooter>
            {showVitalsForm ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (latestVitals) setShowVitalsForm(false);
                    else { setVitalsOpen(false); setVitalsAppointment(null); }
                  }}
                >
                  {latestVitals ? "Back" : "Cancel"}
                </Button>
                <Button
                  onClick={() => vitalsMutation.mutate()}
                  disabled={!Object.values(vitals).some((v) => v !== "") || vitalsMutation.isPending}
                >
                  {vitalsMutation.isPending ? "Saving..." : "Save Vitals"}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => { setVitalsOpen(false); setVitalsAppointment(null); }}>Close</Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Appointment Slip Preview Dialog ── */}
      <Dialog open={!!printAppt} onOpenChange={(open) => { if (!open) setPrintAppt(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" showCloseButton>
          <DialogHeader>
            <DialogTitle>Appointment Slip Preview</DialogTitle>
          </DialogHeader>

          <div ref={printPreviewRef} className="bg-white text-black rounded border border-gray-200 p-5 text-[13px] font-[Arial,Helvetica,sans-serif]">
            {printAppt && (() => {
              const aptDate = new Date(printAppt.date);
              const formattedDate = aptDate.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
              const formattedTime = aptDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
              const apptId = printAppt.id.slice(0, 8).toUpperCase();
              const totalFee = printAppt.fee + (printAppt.registrationFee || 0);
              return (
                <>
                  {/* Header */}
                  <div className="bg-[#1e3a5f] text-white py-4 px-6 text-center rounded-t">
                    <h1 className="text-xl font-bold tracking-wide m-0">{organisation?.name ?? "CLINIC"}</h1>
                    <p className="text-[11px] opacity-85 mt-1 m-0">
                      {[organisation?.address, organisation?.phone].filter(Boolean).join(" | ") || "Healthcare Centre"}
                    </p>
                  </div>

                  {/* Title */}
                  <div className="bg-[#e8edf3] py-2.5 px-6 text-center border-b border-[#1e3a5f]">
                    <h2 className="m-0 text-sm font-bold text-[#1e3a5f] tracking-[2px]">APPOINTMENT SLIP</h2>
                  </div>

                  {/* Body */}
                  <div className="py-5 px-6">
                    {printAppt.tokenNumber && (
                      <div className="float-right border-2 border-[#1e3a5f] py-2 px-3.5 text-center ml-3 mb-2">
                        <div className="text-[9px] font-bold text-[#1e3a5f] tracking-wide">TOKEN</div>
                        <div className="text-xl font-bold text-[#1e3a5f]">#{printAppt.tokenNumber}</div>
                      </div>
                    )}

                    <div className="mb-3.5 text-[11px] text-gray-500">
                      Slip No: <span className="font-mono font-bold">{apptId}</span>
                      {" | "}Date: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </div>

                    <table className="w-full border-collapse mb-4 text-[13px]">
                      <tbody>
                        <tr>
                          <td className="w-1/2 align-top pr-3">
                            <div className="font-bold text-[#1e3a5f] border-b border-gray-200 mb-1.5 pb-1 text-[11px] tracking-wide">PATIENT DETAILS</div>
                            <div className="font-bold text-[13px] mb-0.5">{printAppt.patient ? getPatientName(printAppt.patient) : null}</div>
                            <div className="text-xs text-gray-600 mb-0.5">Phone: {printAppt.patient?.contactNo}</div>
                            {printAppt.patient?.email && <div className="text-xs text-gray-600">Email: {printAppt.patient.email}</div>}
                          </td>
                          <td className="w-1/2 align-top pl-3">
                            <div className="font-bold text-[#1e3a5f] border-b border-gray-200 mb-1.5 pb-1 text-[11px] tracking-wide">DOCTOR DETAILS</div>
                            <div className="font-bold text-[13px] mb-0.5">Dr. {printAppt.doctor?.name ?? printAppt.doctor?.medicalRegistrationNo}</div>
                            {printAppt.doctor?.specialization && <div className="text-xs text-gray-600 mb-0.5">Specialization: {printAppt.doctor.specialization}</div>}
                            {printAppt.doctor?.qualification && <div className="text-xs text-gray-600">Qualification: {printAppt.doctor.qualification}</div>}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Appointment details */}
                    <div className="font-bold text-[#1e3a5f] border-b-2 border-[#1e3a5f] mb-2 pb-1 text-[11px] tracking-wide">APPOINTMENT DETAILS</div>
                    <table className="w-full border-collapse mb-4 text-[13px]">
                      <tbody>
                        <tr>
                          <td className="py-2 pr-1.5 w-1/4 font-bold text-gray-600 text-xs">Date</td>
                          <td className="py-2 pr-1.5 w-1/4 font-bold">{formattedDate}</td>
                          <td className="py-2 pr-1.5 w-1/4 font-bold text-gray-600 text-xs">Time</td>
                          <td className="py-2 pr-1.5 w-1/4 font-bold">{formattedTime}</td>
                        </tr>
                        <tr>
                          <td className="py-1 pr-1.5 font-bold text-gray-600 text-xs">Type</td>
                          <td className="py-1 pr-1.5 text-xs">{printAppt.type.replace("_", " ")}</td>
                          <td className="py-1 pr-1.5 font-bold text-gray-600 text-xs">Status</td>
                          <td className="py-1 pr-1.5 text-xs">{apptStatusLabel(printAppt.status)}</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Fee summary */}
                    <table className="w-full border-collapse mb-4 text-[13px]">
                      <thead>
                        <tr>
                          <th colSpan={2} className="py-1 font-bold text-[#1e3a5f] border-b-2 border-[#1e3a5f] text-[11px] tracking-wide text-left">FEE SUMMARY</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-gray-200">
                          <td className="py-2 pr-1.5 text-xs">Consultation Fee</td>
                          <td className="py-2 pl-1.5 text-right text-xs">{currency(printAppt.fee)}</td>
                        </tr>
                        {printAppt.registrationFee > 0 && (
                          <tr className="border-b border-gray-200">
                            <td className="py-2 pr-1.5 text-xs">Registration Fee</td>
                            <td className="py-2 pl-1.5 text-right text-xs">{currency(printAppt.registrationFee)}</td>
                          </tr>
                        )}
                        <tr>
                          <td className="py-2.5 pr-1.5 text-sm font-bold">Total Amount</td>
                          <td className="py-2.5 pl-1.5 text-right text-sm font-bold text-[#1e3a5f]">{currency(totalFee)}</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Instructions */}
                    <div className="bg-gray-50 border border-gray-200 py-2.5 px-3.5 mb-4 text-[11px] text-gray-600">
                      <strong className="text-[#1e3a5f]">IMPORTANT:</strong> Please arrive 15 minutes before your scheduled time. Bring this slip, previous medical reports, and insurance documents if applicable.
                    </div>

                    {/* Signatures */}
                    <div className="flex justify-between mt-5 text-[11px]">
                      <div className="text-center">
                        <div className="w-36 border-t border-black mb-1 pt-1.5">Patient's Signature</div>
                      </div>
                      <div className="text-center">
                        <div className="w-36 border-t border-black mb-1 pt-1.5">Receptionist's Signature</div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="bg-gray-100 py-2 px-6 text-center text-[10px] text-gray-500 border-t border-gray-200 rounded-b">
                    This is a computer-generated slip. Generated on {new Date().toLocaleString("en-IN")} | {organisation?.email ? `Email: ${organisation.email}` : ""} | {organisation?.website ?? "www.clinic.com"}
                  </div>
                </>
              );
            })()}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPrintAppt(null)}>Close</Button>
            <Button variant="outline" disabled={generatingPdf} onClick={browserPrint}>
              Print
            </Button>
            <Button disabled={generatingPdf} onClick={downloadPrintPdf}>
              {generatingPdf ? "Generating…" : "Download PDF"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
