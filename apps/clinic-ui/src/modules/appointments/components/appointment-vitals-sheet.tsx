import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createPatientVitals, fetchPatientVitalsLatest, getPatientName, type Appointment } from "@/lib/api";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { HeartPulse, Plus } from "lucide-react";

interface AppointmentVitalsSheetProps {
  appointment: Appointment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppointmentVitalsSheet({ appointment, open, onOpenChange }: AppointmentVitalsSheetProps) {
  const queryClient = useQueryClient();
  const [showVitalsForm, setShowVitalsForm] = useState(false);
  const [vitals, setVitals] = useState<Record<string, string>>({
    heightCm: "", weightCm: "", temperatureC: "", pulseBpm: "",
    systolicBp: "", diastolicBp: "", spo2Percent: "", respiratoryRate: "", medicalStatus: "",
  });

  // Latest recorded vitals for the patient whose "Vitals" sheet is open — shown
  // read-only so a previous entry isn't hidden behind an empty form.
  const { data: latestVitals, isLoading: latestVitalsLoading } = useQuery({
    queryKey: ["patientVitals", "latest", appointment?.patientId],
    queryFn: () => fetchPatientVitalsLatest(appointment!.patientId),
    enabled: open && !!appointment?.patientId,
  });

  // Fresh form each time the sheet opens for a (possibly different) appointment.
  useEffect(() => {
    if (open) {
      setVitals({ heightCm: "", weightCm: "", temperatureC: "", pulseBpm: "", systolicBp: "", diastolicBp: "", spo2Percent: "", respiratoryRate: "" });
      setShowVitalsForm(false);
    }
  }, [open, appointment?.id]);

  useEffect(() => {
    if (open && !latestVitalsLoading) {
      setShowVitalsForm(!latestVitals);
    }
  }, [open, latestVitals, latestVitalsLoading]);

  // ── Vitals mutation ──
  const vitalsMutation = useMutation({
    mutationFn: async () => {
      if (!appointment) return;
      const payload: Record<string, string | number> = { patientId: appointment.patientId, appointmentId: appointment.id };
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
      setShowVitalsForm(false);
      setVitals({ heightCm: "", weightCm: "", temperatureC: "", pulseBpm: "", systolicBp: "", diastolicBp: "", spo2Percent: "", respiratoryRate: "", medicalStatus: "" });
      onOpenChange(false);
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) { setShowVitalsForm(false); onOpenChange(false); } }}>
      <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <HeartPulse className="size-5 text-rose-500" />
            {showVitalsForm ? "Record Vitals" : "Patient Vitals"}
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-4 px-4 py-4">
          {appointment && (
            <div className="rounded-none border bg-muted/20 p-3 text-sm">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Patient</span>
              <p className="mt-0.5 font-medium">{appointment.patient ? getPatientName(appointment.patient) : "—"}</p>
              <p className="text-xs text-muted-foreground">{appointment.patient?.contactNo}</p>
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
                  else onOpenChange(false);
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
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}