import { getPatientName, type Appointment, type Organisation } from "@/lib/api";
import { printArea } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apptStatusLabel, currency } from "./appointments-columns";

interface AppointmentSlipPreviewDialogProps {
  appointment: Appointment | null;
  onOpenChange: (open: boolean) => void;
  organisation?: Organisation;
}

export function AppointmentSlipPreviewDialog({ appointment, onOpenChange, organisation }: AppointmentSlipPreviewDialogProps) {
  return (
    <Dialog open={!!appointment} onOpenChange={(open) => { if (!open) onOpenChange(false); }}>
      <DialogContent className="sm:max-w-[calc(210mm+4rem)] max-h-[90vh] overflow-y-auto" showCloseButton>
        <DialogHeader>
          <DialogTitle>Appointment Slip Preview</DialogTitle>
        </DialogHeader>

        {/* The slip renders as a full A5-landscape sheet: 210mm x 148mm,
            with the 6mm gutter applied as the sheet's own border-box
            padding (see @page appointment-slip and .slip-print-area in
            index.css), leaving a 198mm x 136mm content area. The physical
            page geometry deliberately lives in plain CSS, NOT in Tailwind
            arbitrary-mm utilities like w-[198mm]/min-h-[136mm]: those
            resolved differently in the production build than in dev (class
            emission/CSS order differs), which let the printed sheet shrink
            below the printable width and left large horizontal gaps. Only
            screen cosmetics (border, rounding, centering) remain as
            utilities here — print overrides them via #print-area rules. */}
        <div id="print-area" className="slip-print-area mx-auto my-4 bg-white text-black rounded border border-gray-200 font-[Arial,Helvetica,sans-serif] text-[10px]">
          {appointment && (() => {
            const aptDate = new Date(appointment.date);
            const formattedDate = aptDate.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
            const formattedTime = aptDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
            const apptId = appointment.id.slice(0, 8).toUpperCase();
            const totalFee = Math.max(0, appointment.amount + (appointment.registrationFee || 0) - (appointment.amountPaid || 0));
            return (
              <>
                {/* Header */}
                <img src="/header.png" alt="" className="w-full h-auto rounded-t border border-gray-200" />
                <div className="flex items-center justify-end gap-3 px-4 py-1 text-[9px] leading-tight text-gray-600">
                  Slip No: {apptId} | Date: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </div>

                {/* Body */}
                <div className="px-4 py-2">
                  {appointment.tokenNumber && (
                    <div className="mb-1 inline-block border-2 border-[#1e3a5f] py-0.5 px-2">
                      <span className="text-[9px] font-bold text-[#1e3a5f] tracking-wide">TOKEN NO:</span>{" "}
                      <span className="text-[13px] font-bold text-[#1e3a5f]">#{appointment.tokenNumber}</span>
                    </div>
                  )}

                  <table className="w-full border-collapse mb-1.5 text-[10px]">
                    <tbody>
                      <tr>
                        <td className="w-1/2 align-top pr-3">
                          <div className="font-bold text-[#1e3a5f] border-b border-gray-200 mb-0.5 pb-0.5 text-[10px] tracking-wide">PATIENT DETAILS</div>
                          <div className="font-bold text-[11px] mb-0.5">{appointment.patient ? getPatientName(appointment.patient) : null}</div>
                          <div className="text-[10px] text-gray-600 mb-0.5">Phone: {appointment.patient?.contactNo}</div>
                          {appointment.patient?.email && <div className="text-[10px] text-gray-600">Email: {appointment.patient.email}</div>}
                        </td>
                        <td className="w-1/2 align-top pl-3">
                          <div className="font-bold text-[#1e3a5f] border-b border-gray-200 mb-0.5 pb-0.5 text-[10px] tracking-wide">DOCTOR DETAILS</div>
                          <div className="font-bold text-[11px] mb-0.5">{appointment.doctor?.name ?? `Dr. ${appointment.doctor?.medicalRegistrationNo}`}</div>
                          {appointment.doctor?.specialization && <div className="text-[10px] text-gray-600 mb-0.5">Specialization: {appointment.doctor.specialization}</div>}
                          {appointment.doctor?.qualification && <div className="text-[10px] text-gray-600">Qualification: {appointment.doctor.qualification}</div>}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Appointment details */}
                  <div className="font-bold text-[#1e3a5f] mb-1 text-[10px] tracking-wide">APPOINTMENT DETAILS</div>
                  <table className="w-full border-collapse mb-1.5 text-[10px]">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 py-0.5 px-1.5 text-left text-[9px] font-bold text-[#1e3a5f]">FIELD</th>
                        <th className="border border-gray-300 py-0.5 px-1.5 text-left text-[9px] font-bold text-[#1e3a5f]">VALUE</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-200 py-0.5 px-1.5 text-[9px] font-bold text-gray-600">Date</td>
                        <td className="border border-gray-200 py-0.5 px-1.5 text-[10px] font-bold">{formattedDate}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 py-0.5 px-1.5 text-[9px] font-bold text-gray-600">Time</td>
                        <td className="border border-gray-200 py-0.5 px-1.5 text-[10px] font-bold">{formattedTime}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 py-0.5 px-1.5 text-[9px] font-bold text-gray-600">Type</td>
                        <td className="border border-gray-200 py-0.5 px-1.5 text-[10px]">{appointment.type.replace("_", " ")}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 py-0.5 px-1.5 text-[9px] font-bold text-gray-600">Status</td>
                        <td className="border border-gray-200 py-0.5 px-1.5 text-[10px]">{apptStatusLabel(appointment.status)}</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Amount summary — kept unsplittable (break-inside-avoid) so the MONEY
                      RECEIPT can never be torn across printed pages */}
                  <div className="break-inside-avoid">
                  <table className="w-full border-collapse mb-1 text-[10px]">
                    <thead>
                      <tr>
                        <th colSpan={2} className="py-0.5 font-bold text-[#1e3a5f] border-b-2 border-[#1e3a5f] text-[10px] tracking-wide text-left">MONEY RECEIPT</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="py-0.5 pr-1.5 text-[10px]">Amount</td>
                        <td className="py-0.5 pl-1.5 text-right text-[10px]">{currency(appointment.amount)}</td>
                      </tr>
                      {appointment.registrationFee > 0 && (
                        <tr className="border-b border-gray-200">
                          <td className="py-0.5 pr-1.5 text-[10px]">Registration Amount</td>
                          <td className="py-0.5 pl-1.5 text-right text-[10px]">{currency(appointment.registrationFee)}</td>
                        </tr>
                      )}
                      {appointment.amountPaid > 0 && (
                        <tr className="border-b border-gray-200">
                          <td className="py-0.5 pr-1.5 text-[10px]">Amount Paid</td>
                          <td className="py-0.5 pl-1.5 text-right text-[10px]">-{currency(appointment.amountPaid)}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="py-0.5 pr-1.5 text-[11px] font-bold">Total Amount</td>
                        <td className="py-0.5 pl-1.5 text-right text-[11px] font-bold text-[#1e3a5f]">{currency(totalFee)}</td>
                      </tr>
                    </tbody>
                  </table>
                  </div>

                  {/* Instructions */}
                  <div className="bg-gray-50 border border-gray-200 py-1 px-2 mb-1 text-[9px] leading-tight text-gray-600">
                    <strong className="text-[#1e3a5f]">IMPORTANT:</strong> Please arrive 15 minutes before your scheduled time. Bring this slip, previous medical reports, and insurance documents if applicable.
                  </div>

                  {/* Signatures */}
                  <div className="flex justify-between mt-2 text-[9px]">
                    <div className="text-center">
                      <div className="w-32 border-t border-black mb-0.5 pt-0.5">Patient's Signature</div>
                    </div>
                    <div className="text-center">
                      <div className="w-32 border-t border-black mb-0.5 pt-0.5">Receptionist's Signature</div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-100 py-1 px-3 text-center text-[8px] leading-tight text-gray-500 border-t border-gray-200">
                  This is a computer-generated slip. Generated on {new Date().toLocaleString("en-IN")} | {organisation?.email ? `Email: ${organisation.email}` : ""} | {organisation?.website ?? "www.clinic.com"}
                </div>
                <img src="/footer.png" alt="" className="w-full h-auto rounded-b border border-gray-200" />
              </>
            );
          })()}
        </div>

        <DialogFooter className="bg-muted">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Close</Button>
          <Button variant="default" onClick={printArea}>
            Print / Save as PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}