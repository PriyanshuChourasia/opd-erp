import { useState, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation, useParams } from "@tanstack/react-router";
import { Pill, Plus, Search, X, Activity } from "lucide-react";
import {
  fetchPrescription,
  fetchProcedureOrders,
  fetchMedicines,
  updatePrescription,
  getPatientName,
  type Medicine,
} from "@/lib/api";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prescriptionsListRoute } from "../lib/prescription-routes";

interface EditRxItem {
  tempId: string;
  medicineId: string;
  medicineName: string;
  dosage: string;
  duration: string;
  instructions: string;
  quantity: number;
}

export function EditPrescriptionPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  // Mounted from 3 different route ids (_dashboard/_doctor/_receptionist
  // prescriptions), so params are read loosely rather than from one typed route.
  const { prescriptionId } = useParams({ strict: false });
  const backTo = prescriptionsListRoute(location.pathname);

  const [editDiagnosis, setEditDiagnosis] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editItems, setEditItems] = useState<EditRxItem[]>([]);
  const [editMedicineQuery, setEditMedicineQuery] = useState("");
  const [showEditMedicineSearch, setShowEditMedicineSearch] = useState(false);

  // ── Fetch prescription ──
  const { data: prescription, isLoading: prescriptionLoading } = useQuery({
    queryKey: ["prescription", prescriptionId],
    queryFn: () => fetchPrescription(prescriptionId!),
    enabled: !!prescriptionId,
  });

  // ── Fetch procedures ordered for this patient by this doctor ──
  const { data: procedureOrdersResponse } = useQuery({
    queryKey: ["procedure-orders", prescription?.patientId],
    queryFn: () => fetchProcedureOrders({ patientId: prescription!.patientId }),
    enabled: !!prescription?.patientId,
  });
  const procedureOrders = useMemo(
    () => (procedureOrdersResponse ?? []).filter((p) => p.doctorId === prescription?.doctorId),
    [procedureOrdersResponse, prescription?.doctorId],
  );

  // Pre-fill from the fetched prescription, once
  useEffect(() => {
    if (!prescription) return;
    setEditDiagnosis(prescription.diagnosis ?? "");
    setEditNotes(prescription.notes ?? "");
    setEditItems(
      prescription.items.map((item) => ({
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
  }, [prescription]);

  const editMedicineResults = useQuery({
    queryKey: ["medicines", "search", "rx-edit", editMedicineQuery],
    queryFn: () => fetchMedicines({ search: editMedicineQuery, limit: 20 }),
    enabled: editMedicineQuery.trim().length >= 2,
  });
  const editMedicines = editMedicineResults.data?.data ?? [];

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
      updatePrescription(prescriptionId!, {
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
      toast.success("Prescription updated");
      navigate({ to: backTo });
    },
    onError: (err) => { toast.error(extractApiError(err)); },
  });

  if (prescriptionLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-muted-foreground">Loading prescription...</p>
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="flex flex-col items-center gap-2 py-20 text-center">
        <p className="text-sm text-muted-foreground">Prescription not found</p>
        <Button variant="outline" onClick={() => navigate({ to: backTo })}>Back</Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit Prescription</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {getPatientName(prescription.patient)} — Update diagnosis, notes, and prescribed medicines.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate({ to: backTo })}>Cancel</Button>
          <Button disabled={editItems.length === 0 || editMutation.isPending} onClick={() => editMutation.mutate()}>
            {editMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Left: Patient + Doctor (read-only) ── */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Patient</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{getPatientName(prescription.patient)}</p>
              <p className="text-xs text-muted-foreground">{prescription.patient.patientCode}</p>
              <p className="text-xs text-muted-foreground">{prescription.patient.contactNo}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Doctor</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{prescription.doctor.name ?? prescription.doctor.medicalRegistrationNo}</p>
              {prescription.doctor.specialization && <p className="text-xs text-muted-foreground">{prescription.doctor.specialization}</p>}
            </CardContent>
          </Card>

          {/* Procedures */}
          {procedureOrders.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <Activity className="size-4 text-amber-600" />
                  Procedures
                  <Badge variant="outline" className="text-[10px]">{procedureOrders.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {procedureOrders.map((p) => (
                  <div key={p.id} className="rounded-none border-l-2 border-amber-400/50 bg-muted/20 px-3 py-2 text-xs">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-medium">{p.procedureName}</span>
                      <Badge variant="outline" className="text-[10px]">{p.status.replace("_", " ")}</Badge>
                    </div>
                    {p.category && <p className="text-[10px] text-muted-foreground">{p.category}</p>}
                    {p.notes && <p className="text-[11px] text-muted-foreground italic">{p.notes}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Right: Diagnosis, medicines, notes ── */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Diagnosis</CardTitle></CardHeader>
            <CardContent>
              <Input value={editDiagnosis} onChange={(e) => setEditDiagnosis(e.target.value)} placeholder="e.g. Hypertension, Diabetes..." />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Medicines</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowEditMedicineSearch(true)}>
                <Pill className="mr-1 size-3" />Add
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
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
                          <button
                            key={med.id}
                            type="button"
                            className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs hover:bg-muted"
                            onClick={() => addMedicineToEdit(med)}
                          >
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
            <CardContent>
              <Input placeholder="Optional" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}