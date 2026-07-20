import { useEffect, useMemo, useState } from "react";
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
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
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

  // ── Print prescription ──
  const [printRx, setPrintRx] = useState<Prescription | null>(null);

  useEffect(() => {
    function handleAfterPrint() { setPrintRx(null); }
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  function openPrint(rx: Prescription) {
    setPrintRx(rx);
    setTimeout(() => window.print(), 50);
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
            <Button variant="ghost" size="icon" className="size-8" title="Print prescription" aria-label="Print prescription" onClick={() => openPrint(rx)}>
              <Printer className="size-4" />
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
        <select
          className="flex h-9 w-48 rounded-none border border-input bg-background px-3 py-1 text-sm"
          value={filterDoctor}
          onChange={(e) => setFilterDoctorAndResetPage(e.target.value)}
        >
          <option value="">All doctors</option>
          {doctors.map((d) => (<option key={d.id} value={d.id}>{d.name ?? d.medicalRegistrationNo}</option>))}
        </select>
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
                      <Button variant="ghost" size="icon" className="size-5 shrink-0" onClick={() => setEditItems((p) => p.filter((i) => i.tempId !== item.tempId))}>
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

      {/* ── Printable area (hidden on screen, shown only by @media print in index.css) ── */}
      <div id="print-area" className="hidden">
        {printRx && (
          <div className="p-8 text-black">
            <div className="mb-4 border-b-2 border-black pb-3">
              <h1 className="text-xl font-bold">{organisation?.name ?? "Clinic"}</h1>
              {organisation?.address && <p className="text-xs">{organisation.address}</p>}
              {organisation?.phone && <p className="text-xs">Phone: {organisation.phone}</p>}
            </div>
            <div className="mb-4 flex justify-between text-sm">
              <div>
                <p><strong>Patient:</strong> {printRx.patient?.name}</p>
                <p><strong>Phone:</strong> {printRx.patient?.phone}</p>
              </div>
              <div className="text-right">
                <p><strong>Doctor:</strong> {printRx.doctor?.name ?? printRx.doctor?.medicalRegistrationNo}</p>
                <p><strong>Date:</strong> {new Date(printRx.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            {printRx.diagnosis && (
              <p className="mb-3 text-sm"><strong>Diagnosis:</strong> {printRx.diagnosis}</p>
            )}
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b-2 border-black text-left">
                  <th className="py-1">Medicine</th>
                  <th className="py-1">Dosage</th>
                  <th className="py-1">Duration</th>
                  <th className="py-1">Qty</th>
                  <th className="py-1">Instructions</th>
                </tr>
              </thead>
              <tbody>
                {printRx.items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-300">
                    <td className="py-1.5">{item.medicineName}</td>
                    <td className="py-1.5">{item.dosage}</td>
                    <td className="py-1.5">{item.duration || "—"}</td>
                    <td className="py-1.5">{item.quantity}</td>
                    <td className="py-1.5">{item.instructions || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {printRx.notes && (
              <p className="mt-4 text-sm"><strong>Notes:</strong> {printRx.notes}</p>
            )}
            <div className="mt-16 flex justify-end">
              <div className="text-center">
                <div className="mb-1 w-48 border-t border-black" />
                <p className="text-xs">Doctor&apos;s Signature</p>
              </div>
            </div>
          </div>
        )}
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
