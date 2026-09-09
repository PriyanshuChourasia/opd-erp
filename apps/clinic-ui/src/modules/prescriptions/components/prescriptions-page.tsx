import { getPatientName } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "@tanstack/react-router";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { ClipboardList, Receipt, CreditCard, RotateCcw, Ban, Search, Pencil, FileDown, FileText, Eye, Plus, X, Clock, Printer } from "lucide-react";
import {
  fetchPrescriptions,
  fetchPrescriptionHistory,
  fetchBills,
  fetchDoctors,
  fetchOrganisation,
  updateBillStatus,
  type Prescription,
  type PrescriptionHistoryEntry,
  type BillStatus,
  type Patient,
} from "@/lib/api";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { useAppSelector } from "@/store/hooks";
import { hasPermission } from "@/lib/roles";
import { useDateRangeSync } from "@/lib/date-range-search";
import { downloadBlob } from "@/lib/rx-export";
import { newPrescriptionRoute, editPrescriptionRoute } from "../lib/prescription-routes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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

export function PrescriptionsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
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

  // ── Print Preview, PDF and Export Word ──
  const [pdfPreviewRx, setPdfPreviewRx] = useState<Prescription | null>(null);
  const [rxPdfGenerating, setRxPdfGenerating] = useState(false);
  const [rxDocReady, setRxDocReady] = useState(false);
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
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => setPdfPreviewRx(rx)}
                >
                  {rx.status === "ACTIVE" && canUpdate ? <FileText className="size-3.5" /> : <Eye className="size-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{rx.status === "ACTIVE" && canUpdate ? "Preview" : "View"}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8" onClick={() => exportWord(rx)}>
                  <FileDown className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export Word</TooltipContent>
            </Tooltip>
            {rx.status === "ACTIVE" && canUpdate && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8" onClick={() => navigate({ to: editPrescriptionRoute(location.pathname, rx.id), params: { prescriptionId: rx.id } })}>
                    <Pencil className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8" onClick={() => setHistoryRx(rx)}>
                  <Clock className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Version History</TooltipContent>
            </Tooltip>
            {rx.patient && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-8" onClick={() => openInvoices(rx.patientId, rx.patient)}>
                    <Receipt className="size-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Invoices</TooltipContent>
              </Tooltip>
            )}
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
          <Button onClick={() => navigate({ to: newPrescriptionRoute(location.pathname) })}>
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
      <Dialog open={!!pdfPreviewRx} onOpenChange={(open) => { if (!open) { setPdfPreviewRx(null); setRxDocReady(false); } }}>
        <DialogContent className="flex h-[85vh] max-h-[95vh] flex-col overflow-hidden sm:max-w-[850px]" showCloseButton>
          <DialogHeader className="shrink-0">
            <DialogTitle>Prescription Preview</DialogTitle>
          </DialogHeader>

          {previewRxData && (
            <RxDocPreview data={previewRxData} onReady={setRxDocReady} />
          )}

          <DialogFooter className="shrink-0">
            <Button variant="outline" onClick={() => setPdfPreviewRx(null)}>Close</Button>
            <Button variant="default" onClick={downloadRxPdf} disabled={!rxDocReady || rxPdfGenerating} className="gap-1.5">
              <FileDown className="size-3.5" />
              {rxPdfGenerating ? "Generating…" : "Download PDF"}
            </Button>
            <Button variant="default" onClick={printRxDocument} disabled={!rxDocReady} className="gap-1.5">
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
