import { getPatientName } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { ClipboardList, Receipt, CreditCard, RotateCcw, Ban, Search, Pencil, FileDown, FileText, Eye, Pill, Plus, X, Clock, Printer } from "lucide-react";
import {
  fetchPrescriptions,
  createPrescription,
  fetchPrescriptionHistory,
  fetchPatients,
  fetchBills,
  fetchDoctors,
  fetchMedicines,
  fetchOrganisation,
  updateBillStatus,
  updatePrescription,
  type Prescription,
  type PrescriptionHistoryEntry,
  type BillStatus,
  type Medicine,
  type Patient,
} from "@/lib/api";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { useAppSelector } from "@/store/hooks";
import { hasPermission } from "@/lib/roles";
import { useDateRangeSync } from "@/lib/date-range-search";
import { downloadBlob } from "@/lib/rx-export";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, FieldLabel } from "@/components/ui/field";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DataTable } from "@/components/data-table/data-table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RxDocPreview, printRxDocument } from "@/components/prescription-document/RxDoc";
import { rxDocFromSavedPrescription } from "@/components/prescription-document/rx-doc-data";
import { assembleWordDocumentHtml } from "@/components/prescription-document/rx-blocks";
import { generateRxPdf } from "@/components/prescription-document/rx-pdf";
import { PatientFormSheet } from "@/modules/patients/components/patient-form-sheet";

const RX_STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  DISPENSED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const BILL_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  PAID: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  PARTIAL: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  REFUNDED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const RX_STATUSES = ["ACTIVE", "DISPENSED", "CANCELLED"];

function currency(value: number) { const n = Number(value) || 0; return `₹${n.toFixed(2)}`; }

const DIAGNOSIS_WORD_LIMIT = 50;

function truncateWords(text: string, limit: number): { text: string; truncated: boolean } {
  const words = text.trim().split(/\s+/);
  if (words.length <= limit) return { text, truncated: false };
  return { text: words.slice(0, limit).join(" ") + "…", truncated: true };
}

function todayStr() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

interface EditRxItem {
  tempId: string;
  medicineId: string;
  medicineName: string;
  dosage: string;
  duration: string;
  instructions: string;
  quantity: number;
}

export function PrescriptionsPage() {
  const queryClient = useQueryClient();
  // Doctors only ever see their own prescriptions — the server enforces this
  // regardless of what's sent, but we also hide the doctor picker so the UI
  // doesn't imply they could browse other doctors' prescriptions.
  const user = useAppSelector((state) => state.auth.user);
  const isDoctor = user?.userableType === "Doctor";
  const canCreate = hasPermission(user?.permissions, "create", "prescriptions");
  const canUpdate = hasPermission(user?.permissions, "update", "prescriptions");
  const canReadOrganisation = hasPermission(user?.permissions, "read", "company");
  const { data: organisation } = useQuery({ queryKey: ["organisation"], queryFn: fetchOrganisation, enabled: canReadOrganisation });
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 10 });
  const [invoicesOpen, setInvoicesOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; firstName: string; middleName?: string | null; lastName: string; contactNo: string } | null>(null);
  const [editPatientId, setEditPatientId] = useState<string | null>(null);

  // ── Search / filters ──
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filterDoctor, setFilterDoctor] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [doctorSearchQuery, setDoctorSearchQuery] = useState("");
  const [doctorSearchOpen, setDoctorSearchOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPagination((p) => ({ ...p, pageIndex: 0 }));
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  function setFilterDoctorAndResetPage(id: string) {
    setFilterDoctor(id);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }
  function setFilterStatusAndResetPage(status: string) {
    setFilterStatus(status);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }
  const { dateRange } = useDateRangeSync();

  const { data: response, isLoading } = useQuery({
    queryKey: ["prescriptions", search, filterDoctor, filterStatus, dateRange.from, dateRange.to, pagination.pageIndex, pagination.pageSize],
    queryFn: () =>
      fetchPrescriptions({
        search: search || undefined,
        doctorId: filterDoctor || undefined,
        status: filterStatus || undefined,
        from: dateRange.from ?? undefined,
        to: dateRange.to ?? undefined,
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      }),
    placeholderData: (previous) => previous,
  });

  const prescriptions = response?.data ?? [];
  const pageCount = response?.meta?.totalPages ?? 0;

  const { data: doctorsResponse } = useQuery({
    queryKey: ["doctors", "prescriptions-filter"],
    queryFn: () => fetchDoctors({ limit: 100 }),
    enabled: !isDoctor,
  });
  const doctors = doctorsResponse?.data ?? [];

  const { data: billsResponse, isLoading: billsLoading } = useQuery({
    queryKey: ["bills", "patient", selectedPatient?.id],
    queryFn: () => fetchBills({ patientId: selectedPatient!.id, page: 1, limit: 50 }),
    enabled: !!selectedPatient,
  });

  const bills = billsResponse?.data ?? [];

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BillStatus }) => updateBillStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      toast.success(`Bill ${variables.status === "PAID" ? "marked as paid" : variables.status === "REFUNDED" ? "refunded" : "cancelled"}`);
    },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  function openInvoices(patientId: string, patient: { firstName: string; middleName?: string | null; lastName: string; contactNo: string }) {
    setSelectedPatient({ id: patientId, firstName: patient.firstName, middleName: patient.middleName, lastName: patient.lastName, contactNo: patient.contactNo });
    setInvoicesOpen(true);
  }

  // ── Create prescription ──
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [createPatientSearch, setCreatePatientSearch] = useState("");
  const [createPatient, setCreatePatient] = useState<{ id: string; firstName: string; middleName?: string | null; lastName: string; contactNo: string } | null>(null);
  const [createDoctorId, setCreateDoctorId] = useState("");
  const [createDoctorQuery, setCreateDoctorQuery] = useState("");
  const [createDoctorSearchOpen, setCreateDoctorSearchOpen] = useState(false);
  const [createDiagnosis, setCreateDiagnosis] = useState("");
  const [createNotes, setCreateNotes] = useState("");
  const [createItems, setCreateItems] = useState<EditRxItem[]>([]);
  const [createMedicineQuery, setCreateMedicineQuery] = useState("");
  const [showCreateMedicineSearch, setShowCreateMedicineSearch] = useState(false);

  const createPatientResults = useQuery({
    queryKey: ["create-rx-patients", createPatientSearch],
    queryFn: () => fetchPatients({ search: createPatientSearch, limit: 8 }),
    enabled: createPatientSearch.trim().length >= 1 && !createPatient,
  });

  const createMedicineResults = useQuery({
    queryKey: ["medicines", "search", "rx-create", createMedicineQuery],
    queryFn: () => fetchMedicines({ search: createMedicineQuery, limit: 20 }),
    enabled: createMedicineQuery.trim().length >= 2,
  });
  const createMedicines = createMedicineResults.data?.data ?? [];

  const createMutation = useMutation({
    mutationFn: () =>
      createPrescription({
        patientId: createPatient!.id,
        doctorId: createDoctorId,
        diagnosis: createDiagnosis || undefined,
        notes: createNotes || undefined,
        items: createItems.map((item) => ({
          medicineId: item.medicineId,
          medicineName: item.medicineName,
          dosage: item.dosage,
          duration: item.duration || undefined,
          instructions: item.instructions || undefined,
          quantity: item.quantity,
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
      setCreateSheetOpen(false);
      resetCreateForm();
      toast.success("Prescription created successfully");
    },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  function resetCreateForm() {
    setCreatePatient(null);
    setCreatePatientSearch("");
    // For doctors, always use their own ID so they don't have to search for themselves
    setCreateDoctorId(isDoctor ? (user?.userableId ?? "") : "");
    setCreateDoctorQuery("");
    setCreateDiagnosis("");
    setCreateNotes("");
    setCreateItems([]);
    setCreateMedicineQuery("");
    setShowCreateMedicineSearch(false);
  }

  function addMedicineToCreate(med: Medicine) {
    setCreateItems((prev) => [
      ...prev,
      {
        tempId: crypto.randomUUID(),
        medicineId: med.id,
        medicineName: [med.brandName ?? med.name, med.strength].filter(Boolean).join(" "),
        dosage: "1-0-1",
        duration: "7 days",
        instructions: "",
        quantity: 1,
      },
    ]);
    setCreateMedicineQuery("");
    setShowCreateMedicineSearch(false);
  }

  function updateCreateItem(tempId: string, patch: Partial<EditRxItem>) {
    setCreateItems((prev) => prev.map((i) => (i.tempId === tempId ? { ...i, ...patch } : i)));
  }

  // ── Edit prescription ──
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [editingRx, setEditingRx] = useState<Prescription | null>(null);
  const [editDiagnosis, setEditDiagnosis] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editItems, setEditItems] = useState<EditRxItem[]>([]);
  const [editMedicineQuery, setEditMedicineQuery] = useState("");
  const [showEditMedicineSearch, setShowEditMedicineSearch] = useState(false);

  const editMedicineResults = useQuery({
    queryKey: ["medicines", "search", "rx-edit", editMedicineQuery],
    queryFn: () => fetchMedicines({ search: editMedicineQuery, limit: 20 }),
    enabled: editMedicineQuery.trim().length >= 2,
  });
  const editMedicines = editMedicineResults.data?.data ?? [];

  function openEdit(rx: Prescription) {
    setEditingRx(rx);
    setEditDiagnosis(rx.diagnosis ?? "");
    setEditNotes(rx.notes ?? "");
    setEditItems(
      rx.items.map((item) => ({
        tempId: item.id,
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        dosage: item.dosage,
        duration: item.duration ?? "",
        instructions: item.instructions ?? "",
        quantity: item.quantity,
      })),
    );
    setEditMedicineQuery("");
    setShowEditMedicineSearch(false);
    setEditSheetOpen(true);
  }

  function addMedicineToEdit(med: Medicine) {
    setEditItems((prev) => [
      ...prev,
      {
        tempId: crypto.randomUUID(),
        medicineId: med.id,
        medicineName: [med.brandName ?? med.name, med.strength].filter(Boolean).join(" "),
        dosage: "1-0-1",
        duration: "7 days",
        instructions: "",
        quantity: 1,
      },
    ]);
    setEditMedicineQuery("");
    setShowEditMedicineSearch(false);
  }

  function updateEditItem(tempId: string, patch: Partial<EditRxItem>) {
    setEditItems((prev) => prev.map((i) => (i.tempId === tempId ? { ...i, ...patch } : i)));
  }

  const editMutation = useMutation({
    mutationFn: () =>
      updatePrescription(editingRx!.id, {
        diagnosis: editDiagnosis || undefined,
        notes: editNotes || undefined,
        items: editItems.map((item) => ({
          medicineId: item.medicineId,
          medicineName: item.medicineName,
          dosage: item.dosage,
          duration: item.duration || undefined,
          instructions: item.instructions || undefined,
          quantity: item.quantity,
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
      setEditSheetOpen(false);
      setEditingRx(null);
      toast.success("Prescription updated");
    },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  // ── Print Preview, PDF and Export Word ──
  const [pdfPreviewRx, setPdfPreviewRx] = useState<Prescription | null>(null);
  const [rxPdfGenerating, setRxPdfGenerating] = useState(false);
  const previewRxData = useMemo(
    () => (pdfPreviewRx ? rxDocFromSavedPrescription(pdfPreviewRx, organisation) : null),
    [pdfPreviewRx, organisation],
  );

  async function downloadRxPdf() {
    if (!previewRxData) return;
    setRxPdfGenerating(true);
    try {
      const { pageCount } = await generateRxPdf(previewRxData);
      toast.success(pageCount > 1 ? `PDF downloaded (${pageCount} pages)` : "PDF downloaded successfully");
    } catch (err) {
      console.error("PDF generation failed", err);
      toast.error("Failed to generate PDF");
    } finally {
      setRxPdfGenerating(false);
    }
  }

  // ── Version History ──
  const [historyRx, setHistoryRx] = useState<Prescription | null>(null);
  const historyQuery = useQuery({
    queryKey: ["prescription-history", historyRx?.id],
    queryFn: () => fetchPrescriptionHistory(historyRx!.id),
    enabled: !!historyRx,
  });

  function exportWord(rx: Prescription) {
    try {
      const html = assembleWordDocumentHtml(rxDocFromSavedPrescription(rx, organisation));
      const blob = new Blob([html], { type: 'application/msword' });
      const filename = `prescription-${rx.patient ? getPatientName(rx.patient).replace(/\s+/g, '-') : rx.id}.doc`;
      downloadBlob(blob, filename);
      toast.success('Word file downloaded successfully');
    } catch (err) {
      console.error('Word export failed', err);
      toast.error('Failed to export Word file');
    }
  }

  const columns = useMemo<ColumnDef<Prescription>[]>(() => [
    {
      id: "patient",
      header: "Patient",
      cell: ({ row }) => {
        const rx = row.original;
        return (
          <div className="group flex items-center gap-2">
            <span>{rx.patient ? getPatientName(rx.patient) : <span className="text-muted-foreground">—</span>}</span>
            {rx.patient && (
              <button
                type="button"
                className="shrink-0 rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                title="Edit patient"
                onClick={() => setEditPatientId(rx.patient.id)}
              >
                <Pencil className="size-3" />
              </button>
            )}
          </div>
        );
      },
    },
    {
      id: "doctor",
      header: "Doctor",
      cell: ({ row }) => row.original.doctor?.medicalRegistrationNo ?? <span className="text-muted-foreground">—</span>,
    },
    {
      accessorKey: "diagnosis",
      header: "Diagnosis",
      cell: ({ row }) => {
        const diagnosis = row.original.diagnosis;
        if (!diagnosis) return <span className="text-muted-foreground">—</span>;
        const { text, truncated } = truncateWords(diagnosis, DIAGNOSIS_WORD_LIMIT);
        if (!truncated) return <span className="whitespace-pre-wrap">{text}</span>;
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-default">{text}</span>
            </TooltipTrigger>
            <TooltipContent className="max-w-sm whitespace-pre-wrap">{diagnosis}</TooltipContent>
          </Tooltip>
        );
      },
    },
    {
      id: "items",
      header: "Items",
      cell: ({ row }) => row.original.items?.length ?? 0,
    },
    {
      accessorKey: "version",
      header: () => <div className="text-center">Ver</div>,
      cell: ({ row }) => (
        <div className="text-center">
          <Badge variant="outline" className="text-[10px] font-mono">v{row.original.version}</Badge>
        </div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => {
        const rx = row.original;
        return (
          <div className="flex justify-end items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              title={rx.status === "ACTIVE" && canUpdate ? "Preview" : "View"}
              onClick={() => setPdfPreviewRx(rx)}
            >
              {rx.status === "ACTIVE" && canUpdate ? <FileText className="size-3.5" /> : <Eye className="size-3.5" />}
            </Button>
            <Select onValueChange={(value) => {
              if (value === "export-word") exportWord(rx);
              else if (value === "edit") openEdit(rx);
              else if (value === "history") setHistoryRx(rx);
              else if (value === "invoices" && rx.patient) openInvoices(rx.patientId, rx.patient);
            }}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <SelectValue placeholder="Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="export-word">
                  <FileDown className="mr-2 size-3.5" />
                  Export Word
                </SelectItem>
                {rx.status === "ACTIVE" && canUpdate && (
                  <SelectItem value="edit">
                    <Pencil className="mr-2 size-3.5" />
                    Edit
                  </SelectItem>
                )}
                <SelectItem value="history">
                  <Clock className="mr-2 size-3.5" />
                  Version History
                </SelectItem>
                {rx.patient && (
                  <SelectItem value="invoices">
                    Invoices
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        );
      },
    },
  ], []);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Prescriptions</h1>
          <p className="mt-1 text-sm text-muted-foreground">Consultation diagnoses and prescribed medicines</p>
        </div>
        {canCreate && (
          <Button onClick={() => { resetCreateForm(); setCreateSheetOpen(true); }}>
            <Plus className="mr-2 size-4" />Create Prescription
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search patient, phone, diagnosis..."
            className="h-9 pl-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        {!isDoctor && (
          <div className="relative">
            {filterDoctor ? (
              <div className="flex h-9 w-48 items-center justify-between rounded-none border border-input bg-background px-3 text-sm">
                <span className="truncate">{doctors.find((d) => d.id === filterDoctor)?.name ?? doctors.find((d) => d.id === filterDoctor)?.medicalRegistrationNo ?? 'Doctor'}</span>
                <button type="button" className="ml-2 shrink-0 text-muted-foreground hover:text-foreground" title="Clear doctor filter" onClick={() => setFilterDoctorAndResetPage("")}>
                  <X className="size-3.5" />
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
                {doctorSearchOpen && (
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
                          <span className="font-medium">{d.name ?? d.medicalRegistrationNo}</span>
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
        )}

      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={prescriptions}
            pageCount={pageCount}
            pagination={pagination}
            onPaginationChange={setPagination}
            isLoading={isLoading}
            emptyState={
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <ClipboardList className="size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No prescriptions recorded yet</p>
              </div>
            }
          />
        </CardContent>
      </Card>

      {/* ── Create prescription ── */}
      <Sheet open={createSheetOpen} onOpenChange={(open) => { if (!open) { setCreateSheetOpen(false); resetCreateForm(); } }}>
        <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create Prescription</SheetTitle>
            <SheetDescription>Search patient, select doctor, add diagnosis and medicines.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-4 px-4 pb-4">
            {/* Patient */}
            <Field>
              <FieldLabel>Patient *</FieldLabel>
              {createPatient ? (
                <div className="flex items-center justify-between rounded-none border px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{getPatientName(createPatient)}</p>
                    <p className="text-xs text-muted-foreground">{createPatient.contactNo}</p>
                  </div>
                  <Button variant="ghost" size="icon-sm" onClick={() => { setCreatePatient(null); setCreatePatientSearch(""); }}><X className="size-4" /></Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search patient by name or phone..." className="pl-9" value={createPatientSearch} onChange={(e) => setCreatePatientSearch(e.target.value)} />
                  {createPatientSearch.trim().length >= 1 && (
                    <div className="absolute z-10 mt-1 w-full rounded-none border bg-popover shadow-md max-h-56 overflow-y-auto">
                      {createPatientResults.isLoading && <p className="px-3 py-2 text-xs text-muted-foreground">Searching...</p>}
                      {!createPatientResults.isLoading && (createPatientResults.data?.data ?? []).length === 0 && (
                        <p className="px-3 py-2 text-xs text-muted-foreground">No patients found</p>
                      )}
                      {(createPatientResults.data?.data ?? []).map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                          onClick={() => { setCreatePatient({ id: p.id, firstName: p.firstName, middleName: p.middleName, lastName: p.lastName, contactNo: p.contactNo }); setCreatePatientSearch(""); }}
                        >
                          <span className="font-medium">{getPatientName(p)}</span>
                          <span className="text-xs text-muted-foreground">{p.contactNo}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Field>

            {/* Doctor — auto-populated for doctors, shown as a read-only field */}
            <Field>
              <FieldLabel>Doctor *</FieldLabel>
              {isDoctor ? (
                <div className="flex items-center rounded-none border px-3 py-2 bg-muted/30">
                  <span className="text-sm font-medium text-muted-foreground">You (auto-assigned)</span>
                </div>
              ) : createDoctorId ? (
                <div className="flex items-center justify-between rounded-none border px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{doctors.find((d) => d.id === createDoctorId)?.name ?? doctors.find((d) => d.id === createDoctorId)?.medicalRegistrationNo ?? 'Doctor'}</span>
                  </div>
                  <Button variant="ghost" size="icon-sm" onClick={() => setCreateDoctorId("")}><X className="size-4" /></Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search doctor by name or specialization..."
                    className="pl-9"
                    value={createDoctorQuery}
                    onChange={(e) => { setCreateDoctorQuery(e.target.value); setCreateDoctorSearchOpen(true); }}
                    onFocus={() => setCreateDoctorSearchOpen(true)}
                    onBlur={() => setTimeout(() => setCreateDoctorSearchOpen(false), 200)}
                  />
                  {createDoctorSearchOpen && (
                    <div className="absolute z-50 mt-1 w-full rounded-none border bg-popover shadow-md max-h-56 overflow-y-auto">
                      {doctors
                        .filter((d) =>
                          !createDoctorQuery.trim() ||
                          (d.name ?? d.medicalRegistrationNo ?? "").toLowerCase().includes(createDoctorQuery.trim().toLowerCase()) ||
                          (d.specialization ?? "").toLowerCase().includes(createDoctorQuery.trim().toLowerCase())
                        )
                        .length === 0 ? (
                        <p className="px-3 py-2 text-xs text-muted-foreground">No doctors found</p>
                      ) : (
                        doctors
                          .filter((d) =>
                            !createDoctorQuery.trim() ||
                            (d.name ?? d.medicalRegistrationNo ?? "").toLowerCase().includes(createDoctorQuery.trim().toLowerCase()) ||
                            (d.specialization ?? "").toLowerCase().includes(createDoctorQuery.trim().toLowerCase())
                          )
                          .map((d) => (
                            <button
                              key={d.id}
                              type="button"
                              className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-muted"
                              onMouseDown={() => { setCreateDoctorId(d.id); setCreateDoctorSearchOpen(false); setCreateDoctorQuery(""); }}
                            >
                              <span className="font-medium">{d.name ?? d.medicalRegistrationNo}</span>
                              {d.specialization && <span className="text-xs text-muted-foreground">{d.specialization}</span>}
                            </button>
                          ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </Field>

            {/* Diagnosis */}
            <Field><FieldLabel htmlFor="create-diagnosis">Diagnosis</FieldLabel>
              <Input id="create-diagnosis" value={createDiagnosis} onChange={(e) => setCreateDiagnosis(e.target.value)} placeholder="e.g. Hypertension, Diabetes..." />
            </Field>

            {/* Medicines */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FieldLabel>Medicines</FieldLabel>
                <Button variant="outline" size="sm" onClick={() => setShowCreateMedicineSearch(true)}>
                  <Pill className="mr-1 size-3" />Add
                </Button>
              </div>
              {showCreateMedicineSearch && (
                <div className="rounded-none border p-2 space-y-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search medicine..." className="pl-9 h-8 text-xs" autoFocus value={createMedicineQuery} onChange={(e) => setCreateMedicineQuery(e.target.value)} />
                  </div>
                  {createMedicineQuery.trim().length >= 2 && (
                    <div className="max-h-40 overflow-y-auto rounded-none border bg-popover">
                      {createMedicines.length === 0 ? (
                        <p className="px-3 py-2 text-xs text-muted-foreground">No medicines found</p>
                      ) : (
                        createMedicines.map((med) => (
                          <button key={med.id} type="button" className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs hover:bg-muted"
                            onClick={() => addMedicineToCreate(med)}>
                            <span><span className="font-medium">{med.brandName}</span> {med.strength && <span className="text-muted-foreground">{med.strength}</span>}</span>
                            <Plus className="size-3 text-muted-foreground" />
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => { setShowCreateMedicineSearch(false); setCreateMedicineQuery(""); }}>Cancel</Button>
                </div>
              )}
              {createItems.length === 0 ? (
                <p className="py-2 text-center text-xs text-muted-foreground">No medicines added</p>
              ) : (
                createItems.map((item) => (
                  <div key={item.tempId} className="space-y-1.5 rounded-none border px-2 py-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium truncate">{item.medicineName}</p>
                      <Button variant="ghost" size="icon" className="size-5 shrink-0" title="Remove item" onClick={() => setCreateItems((p) => p.filter((i) => i.tempId !== item.tempId))}>
                        <X className="size-3 text-destructive" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <Input className="h-7 text-[11px]" placeholder="Dosage" value={item.dosage} onChange={(e) => updateCreateItem(item.tempId, { dosage: e.target.value })} />
                      <Input className="h-7 text-[11px]" placeholder="Duration" value={item.duration} onChange={(e) => updateCreateItem(item.tempId, { duration: e.target.value })} />
                      <Input className="h-7 text-[11px]" type="number" min={1} placeholder="Qty" value={item.quantity} onChange={(e) => updateCreateItem(item.tempId, { quantity: Number(e.target.value) || 1 })} />
                    </div>
                    <Input className="h-7 text-[11px]" placeholder="Instructions (optional)" value={item.instructions} onChange={(e) => updateCreateItem(item.tempId, { instructions: e.target.value })} />
                  </div>
                ))
              )}
            </div>

            {/* Notes */}
            <Field><FieldLabel htmlFor="create-notes">Notes</FieldLabel>
              <Input id="create-notes" placeholder="Optional" value={createNotes} onChange={(e) => setCreateNotes(e.target.value)} />
            </Field>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => { setCreateSheetOpen(false); resetCreateForm(); }}>Cancel</Button>
            <Button
              disabled={!createPatient || !createDoctorId || createItems.length === 0 || createMutation.isPending}
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? "Creating..." : "Create Prescription"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Edit prescription ── */}
      <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
        <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Prescription{editingRx ? ` — ${editingRx.patient ? getPatientName(editingRx.patient) : null}` : ""}</SheetTitle>
            <SheetDescription>Update diagnosis, notes, and prescribed medicines.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-4 px-4 pb-4">
            <Field><FieldLabel htmlFor="edit-diagnosis">Diagnosis</FieldLabel>
              <Input id="edit-diagnosis" value={editDiagnosis} onChange={(e) => setEditDiagnosis(e.target.value)} />
            </Field>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FieldLabel>Medicines</FieldLabel>
                <Button variant="outline" size="sm" onClick={() => setShowEditMedicineSearch(true)}>
                  <Pill className="mr-1 size-3" />Add
                </Button>
              </div>
              {showEditMedicineSearch && (
                <div className="rounded-none border p-2 space-y-2">
                  <div className="relative">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search medicine..." className="pl-9 h-8 text-xs" autoFocus value={editMedicineQuery} onChange={(e) => setEditMedicineQuery(e.target.value)} />
                  </div>
                  {editMedicineQuery.trim().length >= 2 && (
                    <div className="max-h-40 overflow-y-auto rounded-none border bg-popover">
                      {editMedicines.length === 0 ? (
                        <p className="px-3 py-2 text-xs text-muted-foreground">No medicines found</p>
                      ) : (
                        editMedicines.map((med) => (
                          <button key={med.id} type="button" className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs hover:bg-muted"
                            onClick={() => addMedicineToEdit(med)}>
                            <span><span className="font-medium">{med.brandName}</span> {med.strength && <span className="text-muted-foreground">{med.strength}</span>}</span>
                            <Plus className="size-3 text-muted-foreground" />
                          </button>
                        ))
                      )}
                    </div>
                  )}
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => { setShowEditMedicineSearch(false); setEditMedicineQuery(""); }}>Cancel</Button>
                </div>
              )}
              {editItems.length === 0 ? (
                <p className="py-2 text-center text-xs text-muted-foreground">No medicines added</p>
              ) : (
                editItems.map((item) => (
                  <div key={item.tempId} className="space-y-1.5 rounded-none border px-2 py-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium truncate">{item.medicineName}</p>
                      <Button variant="ghost" size="icon" className="size-5 shrink-0" title="Remove item" onClick={() => setEditItems((p) => p.filter((i) => i.tempId !== item.tempId))}>
                        <X className="size-3 text-destructive" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <Input className="h-7 text-[11px]" placeholder="Dosage" value={item.dosage} onChange={(e) => updateEditItem(item.tempId, { dosage: e.target.value })} />
                      <Input className="h-7 text-[11px]" placeholder="Duration" value={item.duration} onChange={(e) => updateEditItem(item.tempId, { duration: e.target.value })} />
                      <Input className="h-7 text-[11px]" type="number" min={1} placeholder="Qty" value={item.quantity} onChange={(e) => updateEditItem(item.tempId, { quantity: Number(e.target.value) || 1 })} />
                    </div>
                    <Input className="h-7 text-[11px]" placeholder="Instructions (optional)" value={item.instructions} onChange={(e) => updateEditItem(item.tempId, { instructions: e.target.value })} />
                  </div>
                ))
              )}
            </div>

            <Field><FieldLabel htmlFor="edit-notes">Notes</FieldLabel>
              <Input id="edit-notes" placeholder="Optional" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
            </Field>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setEditSheetOpen(false)}>Cancel</Button>
            <Button disabled={editItems.length === 0 || editMutation.isPending} onClick={() => editMutation.mutate()}>
              {editMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={invoicesOpen} onOpenChange={setInvoicesOpen}>
        <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Invoices{selectedPatient ? ` — ${getPatientName(selectedPatient)}` : ""}</SheetTitle>
            <SheetDescription>Bills and payment status for this patient.</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4">
            {billsLoading ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Loading invoices...</p>
            ) : bills.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <Receipt className="size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No invoices for this patient yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bills.map((bill) => (
                  <div key={bill.id} className="rounded-none border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Receipt className="size-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{bill.invoiceNo}</span>
                      </div>
                      <Badge variant="outline" className={`text-[10px] ${BILL_STATUS_STYLES[bill.status] ?? ""}`}>
                        {bill.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {bill.paymentMethod} &middot; {new Date(bill.createdAt).toLocaleString()}
                    </div>
                    {bill.items.length > 0 && (
                      <table className="w-full border-t pt-2 text-xs [&_td]:py-1 [&_th]:pb-1">
                        <thead>
                          <tr className="text-left text-muted-foreground">
                            <th className="font-normal">Item</th>
                            <th className="w-10 text-center font-normal">Qty</th>
                            <th className="w-16 text-right font-normal">Unit</th>
                            <th className="w-16 text-right font-normal">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bill.items.map((item) => (
                            <tr key={item.id}>
                              <td>{item.itemName}</td>
                              <td className="text-center">{item.quantity}</td>
                              <td className="text-right">{currency(item.unitPrice)}</td>
                              <td className="text-right">{currency(item.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    <div className="flex flex-col gap-0.5 border-t pt-2 text-xs text-muted-foreground">
                      <div className="flex justify-between"><span>Subtotal</span><span>{currency(bill.subtotal)}</span></div>
                      {bill.discount > 0 && <div className="flex justify-between"><span>Discount</span><span>-{currency(bill.discount)}</span></div>}
                      {bill.tax > 0 && <div className="flex justify-between"><span>Tax</span><span>{currency(bill.tax)}</span></div>}
                      <div className="flex justify-between text-sm font-semibold text-foreground"><span>Total</span><span>{currency(bill.total)}</span></div>
                    </div>
                    {bill.notes && <p className="text-xs text-muted-foreground">Note: {bill.notes}</p>}
                    <div className="flex gap-1 pt-1">
                      {(bill.status === "PENDING" || bill.status === "PARTIAL") && (
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => statusMutation.mutate({ id: bill.id, status: "PAID" })}>
                          <CreditCard className="mr-1 size-3" />Mark Paid
                        </Button>
                      )}
                      {bill.status === "PAID" && (
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => statusMutation.mutate({ id: bill.id, status: "REFUNDED" })}>
                          <RotateCcw className="mr-1 size-3" />Refund
                        </Button>
                      )}
                      {bill.status === "PENDING" && (
                        <Button variant="outline" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => statusMutation.mutate({ id: bill.id, status: "CANCELLED" })}>
                          <Ban className="mr-1 size-3" />Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Print Preview Dialog ── */}
      <Dialog open={!!pdfPreviewRx} onOpenChange={(open) => { if (!open) setPdfPreviewRx(null); }}>
        <DialogContent className="flex h-[85vh] max-h-[95vh] flex-col overflow-hidden sm:max-w-[850px]" showCloseButton>
          <DialogHeader className="shrink-0">
            <DialogTitle>Prescription Preview</DialogTitle>
          </DialogHeader>

          {previewRxData && (
            <RxDocPreview data={previewRxData} />
          )}

          <DialogFooter className="shrink-0">
            <Button variant="outline" onClick={() => setPdfPreviewRx(null)}>Close</Button>
            <Button variant="default" onClick={downloadRxPdf} disabled={!previewRxData || rxPdfGenerating} className="gap-1.5">
              <FileDown className="size-3.5" />
              {rxPdfGenerating ? "Generating…" : "Download PDF"}
            </Button>
            <Button variant="default" onClick={printRxDocument} disabled={!previewRxData} className="gap-1.5">
              <Printer className="size-3.5" />Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      {/* ── Version History Dialog ── */}
      <Dialog open={!!historyRx} onOpenChange={(open) => { if (!open) setHistoryRx(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Version History{historyRx ? ` — v${historyRx.version}` : ""}</DialogTitle>
          </DialogHeader>
          {historyQuery.isLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Loading history...</p>
          ) : (historyQuery.data ?? []).length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No history entries found</p>
          ) : (
            <div className="space-y-3">
              {historyQuery.data!.map((entry) => (
                <div key={entry.id} className="rounded-none border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] font-mono">v{entry.version}</Badge>
                      <Badge variant="outline" className={`text-[10px] ${entry.changeType === "CREATE" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                        {entry.changeType}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] ${RX_STATUS_STYLES[entry.status] ?? ""}`}>
                        {entry.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {entry.changeReason && (
                    <p className="text-xs text-muted-foreground">Reason: {entry.changeReason}</p>
                  )}
                  {entry.createdBy && (
                    <p className="text-xs text-muted-foreground">By: {entry.createdBy.firstName} {entry.createdBy.lastName}</p>
                  )}
                  {entry.diagnosis && (
                    <p className="text-xs"><span className="font-medium">Diagnosis:</span> {entry.diagnosis}</p>
                  )}
                  {entry.items && entry.items.length > 0 && (
                    <div className="text-xs">
                      <span className="font-medium">Medicines:</span>
                      <ul className="mt-1 list-disc pl-4 text-muted-foreground">
                        {entry.items.map((item, idx) => (
                          <li key={idx}>{item.medicineName} — {item.dosage}{item.duration ? `, ${item.duration}` : ""}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryRx(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PatientFormSheet
        open={!!editPatientId}
        onOpenChange={(open) => { if (!open) setEditPatientId(null); }}
        editingPatient={editPatientId ? prescriptions.find((rx) => rx.patient?.id === editPatientId)?.patient ?? null : null}
        onSaved={() => { queryClient.invalidateQueries({ queryKey: ["prescriptions"] }); setEditPatientId(null); }}
      />
    </div>
  );
}
