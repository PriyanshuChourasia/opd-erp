import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { fetchPrescriptionTemplateForDoctor, type Prescription } from "@/lib/api";
import { PrescriptionTemplatePreview, type PrescriptionPrintData } from "@/modules/prescription-templates/components/prescription-template-preview";

interface Props {
  prescription: Prescription;
  /** "icon" for a compact row action (prescriptions list); "button" for a full labeled button (consultation page) */
  variant?: "icon" | "button";
}

/**
 * Prints a prescription on its doctor's assigned template — falling back to
 * the global default template when the doctor has none assigned. Fetches the
 * template lazily (only once the dialog is opened) via GET
 * /prescription-templates/for-doctor/:doctorId.
 */
export function PrintPrescriptionButton({ prescription, variant = "button" }: Props) {
  const [open, setOpen] = useState(false);

  const { data: template, isLoading } = useQuery({
    queryKey: ["prescription-template-for-doctor", prescription.doctorId],
    queryFn: () => fetchPrescriptionTemplateForDoctor(prescription.doctorId),
    enabled: open,
  });

  const printData: PrescriptionPrintData = {
    patient: {
      firstName: prescription.patient.firstName,
      lastName: prescription.patient.lastName,
      dateOfBirth: prescription.patient.dateOfBirth,
      gender: prescription.patient.gender,
    },
    items: prescription.items.map((item) => ({
      medicineName: item.medicineName,
      dosage: item.dosage,
      duration: item.duration,
      instructions: item.instructions,
    })),
    diagnosis: prescription.diagnosis,
    notes: prescription.notes,
    date: new Date(prescription.createdAt).toLocaleDateString(),
  };

  return (
    <>
      {variant === "icon" ? (
        <Button variant="ghost" size="icon" className="size-8" onClick={() => setOpen(true)} title="Print">
          <Printer className="size-3.5" />
        </Button>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Printer className="mr-2 size-3.5" />Print
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader><DialogTitle>Print Prescription</DialogTitle></DialogHeader>
          {isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Loading template...</p>
          ) : !template ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No prescription template is configured. Create a default template under Organisation → Rx Templates first.
            </p>
          ) : (
            <div id="print-area">
              <PrescriptionTemplatePreview template={template} onOpenChange={() => {}} inline data={printData} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
            <Button onClick={() => window.print()} disabled={!template}>
              <Printer className="mr-2 size-3.5" />Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
