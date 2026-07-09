import { useEffect, useState } from "react";
import { useCreatePatient, useUpdatePatient } from "../data/hooks";
import type { Patient } from "../data/interface";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AddressManager } from "@/modules/addresses/components/address-manager";

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  dateOfBirth: "",
  gender: "",
  bloodGroup: "",
  address: "",
  emergencyContact: "",
};

interface PatientFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPatient?: Patient | null;
  onSaved?: (patient: Patient) => void;
}

export function PatientFormSheet({ open, onOpenChange, editingPatient, onSaved }: PatientFormSheetProps) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!open) return;
    setForm(
      editingPatient
        ? {
            name: editingPatient.name,
            phone: editingPatient.phone,
            email: editingPatient.email ?? "",
            dateOfBirth: editingPatient.dateOfBirth?.slice(0, 10) ?? "",
            gender: editingPatient.gender ?? "",
            bloodGroup: editingPatient.bloodGroup ?? "",
            address: editingPatient.address ?? "",
            emergencyContact: editingPatient.emergencyContact ?? "",
          }
        : emptyForm,
    );
  }, [open, editingPatient]);

  const createMutation = useCreatePatient();
  const updateMutation = useUpdatePatient();

  function handleSave() {
    if (!form.name.trim() || !form.phone.trim()) return;
    if (editingPatient) {
      updateMutation.mutate(
        { id: editingPatient.id, data: form },
        { onSuccess: (patient) => { onOpenChange(false); onSaved?.(patient); } },
      );
    } else {
      createMutation.mutate(form as any, {
        onSuccess: (patient) => { onOpenChange(false); onSaved?.(patient); },
      });
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{editingPatient ? "Edit Patient" : "Register Patient"}</SheetTitle>
          <SheetDescription>
            {editingPatient ? "Update patient details below." : "Register a new patient for the front desk."}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-4 px-4 pb-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="p-name">Full Name *</FieldLabel>
              <Input id="p-name" placeholder="Jane Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field>
              <FieldLabel htmlFor="p-phone">Phone *</FieldLabel>
              <Input id="p-phone" placeholder="+1 555-000-0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field>
              <FieldLabel htmlFor="p-email">Email</FieldLabel>
              <Input id="p-email" type="email" placeholder="jane@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <div className="flex gap-3">
              <Field className="flex-1">
                <FieldLabel htmlFor="p-dob">Date of Birth</FieldLabel>
                <Input id="p-dob" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
              </Field>
              <Field className="flex-1">
                <FieldLabel htmlFor="p-gender">Gender</FieldLabel>
                <select
                  id="p-gender"
                  className="flex h-9 w-full rounded-none border border-input bg-background px-3 py-1 text-sm"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                >
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="p-blood">Blood Group</FieldLabel>
              <select
                id="p-blood"
                className="flex h-9 w-full rounded-none border border-input bg-background px-3 py-1 text-sm"
                value={form.bloodGroup}
                onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
              >
                <option value="">Select...</option>
                <option value="A+">A+</option><option value="A-">A-</option>
                <option value="B+">B+</option><option value="B-">B-</option>
                <option value="O+">O+</option><option value="O-">O-</option>
                <option value="AB+">AB+</option><option value="AB-">AB-</option>
              </select>
            </Field>
            <Field>
              <FieldLabel htmlFor="p-address">Address (flat)</FieldLabel>
              <Input id="p-address" placeholder="123 Main St" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </Field>
            {editingPatient?.id ? (
              <div className="border-t pt-3 mt-2">
                <AddressManager addressableType="Patient" addressableId={editingPatient.id} />
              </div>
            ) : (
              <div className="border-t pt-3 mt-2">
                <p className="text-xs text-muted-foreground">Save the patient first to add addresses.</p>
              </div>
            )}
            <Field>
              <FieldLabel htmlFor="p-emergency">Emergency Contact</FieldLabel>
              <Input id="p-emergency" placeholder="+1 555-000-0000" value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} />
            </Field>
          </FieldGroup>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!form.name.trim() || !form.phone.trim() || isPending}>
            {editingPatient ? "Save Changes" : "Register Patient"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
