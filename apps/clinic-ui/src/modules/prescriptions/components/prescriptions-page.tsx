import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { ClipboardList, Receipt, CreditCard, RotateCcw, Ban, Search, Pencil, Printer, Pill, Plus, X } from "lucide-react";
import {
  fetchPrescriptions,
  fetchBills,
  fetchDoctors,
  fetchMedicines,
  fetchOrganisation,
  updateBillStatus,
  updatePrescription,
  type Prescription,
  type BillStatus,
  type Medicine,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { useAppSelector } from "@/store/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, FieldLabel } from "@/components/ui/field";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { DataTable } from "@/components/data-table/data-table";
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

function currency(value: number) { return `₹${value.toFixed(2)}`; }

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
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 });
  const [invoicesOpen, setInvoicesOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; name: string } | null>(null);
  const [editPatientId, setEditPatientId] = useState<string | null>(null);

  // ── Search / filters ──
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filterDoctor, setFilterDoctor] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState("");
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
  function setFilterDateAndResetPage(date: string) {
    setFilterDate(date);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }

  const { data: response, isLoading } = useQuery({
    queryKey: ["prescriptions", search, filterDoctor, filterStatus, filterDate, pagination.pageIndex, pagination.pageSize],
    queryFn: () =>
      fetchPrescriptions({
        search: search || undefined,
        doctorId: filterDoctor || undefined,
        status: filterStatus || undefined,
        date: filterDate || undefined,
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

  const { data: organisation } = useQuery({ queryKey: ["organisation"], queryFn: fetchOrganisation });

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

  function openInvoices(patientId: string, patientName: string) {
    setSelectedPatient({ id: patientId, name: patientName });
    setInvoicesOpen(true);
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

  // ── Print prescription (generate PDF first) ──
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [printRx, setPrintRx] = useState<Prescription | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  async function openPrint(rx: Prescription) {
    setPrintRx(rx);
    setGeneratingPdf(true);
    // Wait for React to render the print area
    await new Promise((r) => setTimeout(r, 100));
    const element = printAreaRef.current;
    if (!element) { setGeneratingPdf(false); return; }
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const blob = await html2pdf().set({
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `prescription-${rx.patient?.name?.replace(/\s+/g, '-') ?? rx.id}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, letterRendering: true, useCORS: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
      }).from(element).outputPdf('blob');
      const url = URL.createObjectURL(blob);
      const pdfWindow = window.open(url, '_blank');
      // Revoke blob URL after the window has loaded
      setTimeout(() => { URL.revokeObjectURL(url); }, 10_000);
    } catch (err) {
      console.error('PDF generation failed', err);
      // Fallback: use browser print
      window.print();
    } finally {
      setGeneratingPdf(false);
      setPrintRx(null);
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
            <span>{rx.patient?.name ?? <span className="text-muted-foreground">—</span>}</span>
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
      cell: ({ row }) => row.original.diagnosis || <span className="text-muted-foreground">—</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge variant="outline" className={`text-[10px] uppercase ${RX_STATUS_STYLES[status] ?? ""}`}>
            {status}
          </Badge>
        );
      },
    },
    {
      id: "items",
      header: "Items",
      cell: ({ row }) => row.original.items?.length ?? 0,
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
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" className="size-8" title="Print prescription" aria-label="Print prescription" disabled={generatingPdf} onClick={() => openPrint(rx)}>
              <Printer className={cn("size-4", generatingPdf && "animate-pulse")} />
            </Button>
            <Button variant="ghost" size="icon" className="size-8" title="Edit prescription" aria-label="Edit prescription" onClick={() => openEdit(rx)}>
              <Pencil className="size-4" />
            </Button>
            {rx.patient && (
              <Button variant="ghost" size="sm" onClick={() => openInvoices(rx.patientId, rx.patient.name)}>
                <Receipt className="mr-1.5 size-3.5" />
                Invoices
              </Button>
            )}
          </div>
        );
      },
    },
  ], []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Prescriptions</h1>
        <p className="mt-1 text-sm text-muted-foreground">Consultation diagnoses and prescribed medicines</p>
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
        <select
          className="flex h-9 w-40 rounded-none border border-input bg-background px-3 py-1 text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatusAndResetPage(e.target.value)}
        >
          <option value="">All statuses</option>
          {RX_STATUSES.map((s) => (<option key={s} value={s}>{s}</option>))}
        </select>
        <div className="ml-auto flex items-center gap-2">
          <Button variant={!filterDate ? "default" : "outline"} size="sm" onClick={() => setFilterDateAndResetPage("")}>All</Button>
          <Button variant={filterDate === todayStr() ? "default" : "outline"} size="sm" onClick={() => setFilterDateAndResetPage(todayStr())}>Today</Button>
          <Input type="date" className="w-auto" value={filterDate} onChange={(e) => setFilterDateAndResetPage(e.target.value)} />
        </div>
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

      {/* ── Edit prescription ── */}
      <Sheet open={editSheetOpen} onOpenChange={setEditSheetOpen}>
        <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Edit Prescription{editingRx ? ` — ${editingRx.patient?.name}` : ""}</SheetTitle>
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
            <SheetTitle>Invoices{selectedPatient ? ` — ${selectedPatient.name}` : ""}</SheetTitle>
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

      {/* ── Official Prescription for PDF generation ── */}
      <div ref={printAreaRef} className="fixed left-[-9999px] top-0 bg-white text-black" style={{ zIndex: -1 }}>
        {printRx && (() => {
          const rxDate = new Date(printRx.createdAt);
          const formattedDate = rxDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
          return (
            <div style={{ fontFamily: 'Arial, Helvetica, sans-serif', padding: '0', margin: '0', color: '#000' }}>
              {/* Outer border frame */}
              <div style={{ border: '2px solid #1e3a5f', margin: '20px' }}>
                {/* ── HEADER ── */}
                <div style={{ background: '#1e3a5f', color: '#fff', padding: '18px 24px', textAlign: 'center' }}>
                  <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', letterSpacing: '1px' }}>
                    {organisation?.name ?? "CLINIC"}
                  </h1>
                  <p style={{ margin: '4px 0 0', fontSize: '11px', opacity: 0.85 }}>
                    {[organisation?.address, organisation?.phone].filter(Boolean).join(' | ') || 'Healthcare Centre'}
                  </p>
                </div>

                {/* ── TITLE BAR ── */}
                <div style={{ background: '#e8edf3', padding: '10px 24px', textAlign: 'center', borderBottom: '1px solid #1e3a5f' }}>
                  <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#1e3a5f', letterSpacing: '2px' }}>
                    MEDICAL PRESCRIPTION
                  </h2>
                </div>

                {/* ── BODY ── */}
                <div style={{ padding: '20px 24px' }}>
                  {/* Reference */}
                  <div style={{ marginBottom: '14px', fontSize: '11px', color: '#666' }}>
                    Rx No: <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{printRx.id.slice(0, 8).toUpperCase()}</span>
                    {' | '}Date: {formattedDate}
                  </div>

                  {/* Patient & Doctor info in two columns */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '13px' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '50%', verticalAlign: 'top', paddingRight: '12px' }}>
                          <div style={{ fontWeight: 'bold', color: '#1e3a5f', borderBottom: '1px solid #ddd', marginBottom: '6px', paddingBottom: '4px', fontSize: '11px', letterSpacing: '1px' }}>PATIENT DETAILS</div>
                          <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '3px' }}>{printRx.patient?.name}</div>
                          <div style={{ fontSize: '12px', color: '#444', marginBottom: '2px' }}>Phone: {printRx.patient?.phone}</div>
                          {printRx.patient?.email && <div style={{ fontSize: '12px', color: '#444' }}>Email: {printRx.patient.email}</div>}
                        </td>
                        <td style={{ width: '50%', verticalAlign: 'top', paddingLeft: '12px' }}>
                          <div style={{ fontWeight: 'bold', color: '#1e3a5f', borderBottom: '1px solid #ddd', marginBottom: '6px', paddingBottom: '4px', fontSize: '11px', letterSpacing: '1px' }}>PRESCRIBED BY</div>
                          <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '3px' }}>Dr. {printRx.doctor?.name ?? printRx.doctor?.medicalRegistrationNo}</div>
                          {printRx.doctor?.qualification && <div style={{ fontSize: '12px', color: '#444', marginBottom: '2px' }}>{printRx.doctor.qualification}</div>}
                          {printRx.doctor?.specialization && <div style={{ fontSize: '12px', color: '#444' }}>{printRx.doctor.specialization}</div>}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Diagnosis */}
                  {printRx.diagnosis && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontWeight: 'bold', color: '#1e3a5f', borderBottom: '1px solid #ddd', marginBottom: '6px', fontSize: '11px', letterSpacing: '1px', paddingBottom: '4px' }}>DIAGNOSIS</div>
                      <p style={{ margin: 0, fontSize: '13px' }}>{printRx.diagnosis}</p>
                    </div>
                  )}

                  {/* Medicines Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#f0f2f5' }}>
                        <th style={{ border: '1px solid #ccc', padding: '7px 8px', textAlign: 'left', fontWeight: 'bold', color: '#1e3a5f', fontSize: '11px', letterSpacing: '0.5px' }}>#</th>
                        <th style={{ border: '1px solid #ccc', padding: '7px 8px', textAlign: 'left', fontWeight: 'bold', color: '#1e3a5f', fontSize: '11px', letterSpacing: '0.5px', width: '30%' }}>MEDICINE</th>
                        <th style={{ border: '1px solid #ccc', padding: '7px 8px', textAlign: 'left', fontWeight: 'bold', color: '#1e3a5f', fontSize: '11px', letterSpacing: '0.5px', width: '15%' }}>DOSAGE</th>
                        <th style={{ border: '1px solid #ccc', padding: '7px 8px', textAlign: 'left', fontWeight: 'bold', color: '#1e3a5f', fontSize: '11px', letterSpacing: '0.5px', width: '15%' }}>DURATION</th>
                        <th style={{ border: '1px solid #ccc', padding: '7px 8px', textAlign: 'left', fontWeight: 'bold', color: '#1e3a5f', fontSize: '11px', letterSpacing: '0.5px', width: '10%' }}>QTY</th>
                        <th style={{ border: '1px solid #ccc', padding: '7px 8px', textAlign: 'left', fontWeight: 'bold', color: '#1e3a5f', fontSize: '11px', letterSpacing: '0.5px' }}>INSTRUCTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printRx.items.map((item, idx) => (
                        <tr key={item.id}>
                          <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'center', fontSize: '11px', color: '#666' }}>{idx + 1}</td>
                          <td style={{ border: '1px solid #ddd', padding: '6px 8px', fontWeight: 'bold', fontSize: '12px' }}>{item.medicineName}</td>
                          <td style={{ border: '1px solid #ddd', padding: '6px 8px', fontSize: '12px' }}>{item.dosage}</td>
                          <td style={{ border: '1px solid #ddd', padding: '6px 8px', fontSize: '12px' }}>{item.duration || '—'}</td>
                          <td style={{ border: '1px solid #ddd', padding: '6px 8px', textAlign: 'center', fontSize: '12px' }}>{item.quantity}</td>
                          <td style={{ border: '1px solid #ddd', padding: '6px 8px', fontSize: '11px', color: '#555' }}>{item.instructions || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Notes */}
                  {printRx.notes && (
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontWeight: 'bold', color: '#1e3a5f', borderBottom: '1px solid #ddd', marginBottom: '6px', fontSize: '11px', letterSpacing: '1px', paddingBottom: '4px' }}>NOTES</div>
                      <p style={{ margin: 0, fontSize: '12px' }}>{printRx.notes}</p>
                    </div>
                  )}

                  {/* Doctor's Signature */}
                  <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ width: '180px', borderTop: '1px solid #000', marginBottom: '4px', paddingTop: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Dr. {printRx.doctor?.name ?? printRx.doctor?.medicalRegistrationNo}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#666' }}>Doctor's Signature & Stamp</div>
                    </div>
                  </div>

                  {/* Disclaimer */}
                  <div style={{ marginTop: '16px', padding: '8px 12px', background: '#f8f9fa', border: '1px solid #ddd', fontSize: '9px', color: '#888', lineHeight: '1.4' }}>
                    This prescription is valid only for the patient named above. In case of any adverse reaction, please consult your doctor immediately. Keep this prescription for future reference.
                  </div>
                </div>

                {/* ── FOOTER ── */}
                <div style={{ background: '#f0f2f5', padding: '8px 24px', textAlign: 'center', fontSize: '10px', color: '#666', borderTop: '1px solid #ddd' }}>
                  Computer-generated prescription | Generated on {new Date().toLocaleString('en-IN')} | {organisation?.email ? `Email: ${organisation.email}` : ''}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      <PatientFormSheet
        open={!!editPatientId}
        onOpenChange={(open) => { if (!open) setEditPatientId(null); }}
        editingPatient={editPatientId ? prescriptions.find((rx) => rx.patient?.id === editPatientId)?.patient ?? null : null}
        onSaved={() => { queryClient.invalidateQueries({ queryKey: ["prescriptions"] }); setEditPatientId(null); }}
      />
    </div>
  );
}
