import { useQuery } from "@tanstack/react-query";
import { Printer } from "lucide-react";
import { fetchReceipt, type ReceiptData } from "@/lib/api";
import { printArea } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

function currency(value: number) {
  return `₹${(value / 100).toFixed(2)}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface ReceiptViewSheetProps {
  billId: string | null;
  paymentId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function ReceiptViewSheet({ billId, paymentId, onOpenChange }: ReceiptViewSheetProps) {
  const isOpen = !!billId && !!paymentId;

  const { data: receipt, isLoading } = useQuery({
    queryKey: ["receipt", billId, paymentId],
    queryFn: () => fetchReceipt(billId!, paymentId!),
    enabled: isOpen,
  });

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onOpenChange(false)}>
      <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <SheetTitle>Receipt</SheetTitle>
              <SheetDescription>Formal payment receipt document.</SheetDescription>
            </div>
            {isOpen && (
              <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={printArea}>
                <Printer className="size-3.5" />Print
              </Button>
            )}
          </div>
        </SheetHeader>

        {isLoading ? (
          <div className="space-y-4 px-4 pb-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : receipt ? (
          <ReceiptDocument data={receipt} />
        ) : (
          <div className="px-4 pb-4 text-sm text-muted-foreground">
            Receipt data not available.
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ReceiptDocument({ data }: { data: ReceiptData }) {
  const { receipt, bill, patient, address, doctor, company } = data;

  return (
    <div id="print-area" className="space-y-5 px-4 pb-4 text-sm">
      {/* Company Letterhead */}
      {company && (
        <div className="border-b pb-4 text-center">
          <p className="text-lg font-bold tracking-tight">{company.name}</p>
          {company.address && <p className="text-xs text-muted-foreground">{company.address}</p>}
          <p className="text-xs text-muted-foreground">
            {[company.phone, company.email, company.website].filter(Boolean).join(" · ")}
          </p>
          <div className="mt-2 flex justify-center gap-4 text-[10px] text-muted-foreground">
            {company.gstNumber && <span>GST No: {company.gstNumber}</span>}
            {company.panNumber && <span>PAN: {company.panNumber}</span>}
            {company.cinNumber && <span>CIN: {company.cinNumber}</span>}
          </div>
        </div>
      )}

      {/* Receipt Title */}
      <div className="text-center">
        <p className="text-base font-bold uppercase tracking-widest text-primary">Receipt</p>
      </div>

      {/* Receipt Number & Date */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Receipt Number</p>
          <p className="font-semibold">{receipt.voucherNumber ?? "—"}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Date</p>
          <p className="font-medium">{formatDate(receipt.voucherDate)}</p>
          <p className="text-xs text-muted-foreground">{formatDateTime(receipt.voucherDate)}</p>
        </div>
      </div>

      {/* Patient Details */}
      {patient && (
        <div className="rounded-none border p-3">
          <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">Patient Details</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="font-medium">{patient.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">UHID</p>
              <p className="font-medium">{patient.patientCode}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Contact No.</p>
              <p>{patient.contactNo}</p>
            </div>
            {patient.email && (
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p>{patient.email}</p>
              </div>
            )}
          </div>
          {address && (
            <div className="mt-2 border-t pt-2">
              <p className="text-xs text-muted-foreground">Address</p>
              <p className="text-xs">
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}
                {address.city ? `, ${address.city}` : ""}
                {address.state ? `, ${address.state}` : ""}
                {address.postalCode ? ` - ${address.postalCode}` : ""}
              </p>
            </div>
          )}
          <div className="mt-2 border-t pt-2">
            <p className="text-xs text-muted-foreground">Recipient GST No.</p>
            <p className="text-xs">NA (B2C)</p>
          </div>
        </div>
      )}

      {/* Doctor & Appointment */}
      {(doctor || bill.appointmentId) && (
        <div className="rounded-none border p-3">
          <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">Service Details</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {doctor && (
              <>
                <div>
                  <p className="text-xs text-muted-foreground">Doctor</p>
                  <p className="font-medium">{doctor.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Speciality</p>
                  <p>{doctor.specialization ?? "—"}</p>
                </div>
              </>
            )}
            {bill.appointmentId && (
              <div>
                <p className="text-xs text-muted-foreground">Appointment ID</p>
                <p className="font-mono text-xs">{bill.appointmentId.slice(0, 8)}…</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Line Items Table */}
      <div>
        <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">Services</p>
        <table className="w-full text-xs [&_td]:py-1.5 [&_th]:pb-1.5">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="font-normal">Service Name</th>
              <th className="w-10 text-center font-normal">Qty</th>
              <th className="w-20 text-right font-normal">Rate</th>
              <th className="w-20 text-right font-normal">Amount</th>
            </tr>
          </thead>
          <tbody>
            {bill.items.map((item) => (
              <tr key={item.id} className="border-b last:border-0">
                <td>
                  <span className="font-medium">{item.itemName}</span>
                  <span className="ml-1 text-muted-foreground">({item.itemType})</span>
                </td>
                <td className="text-center">{item.quantity}</td>
                <td className="text-right">{currency(item.unitPrice)}</td>
                <td className="text-right font-medium">{currency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex flex-col gap-0.5 border-t pt-2 text-xs text-muted-foreground">
        <div className="flex justify-between"><span>Subtotal</span><span>{currency(bill.subtotal)}</span></div>
        {bill.discount > 0 && (
          <div className="flex justify-between"><span>Less: Discount</span><span className="text-green-600">−{currency(bill.discount)}</span></div>
        )}
        {bill.tax > 0 && (
          <div className="flex justify-between"><span>GST</span><span>{currency(bill.tax)}</span></div>
        )}
        <div className="flex justify-between border-t pt-2 text-sm font-bold text-foreground">
          <span>Total Amount</span>
          <span>{currency(bill.total)}</span>
        </div>
      </div>

      {/* Payment Details */}
      <div className="rounded-none border p-3">
        <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">Payment Received</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Amount</p>
            <p className="text-lg font-bold text-green-600">{currency(receipt.amount)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Method</p>
            <p className="font-medium">{receipt.method}</p>
          </div>
          {receipt.referenceNumber && (
            <div>
              <p className="text-xs text-muted-foreground">Reference</p>
              <p className="font-mono text-xs">{receipt.referenceNumber}</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t pt-3 text-[10px] text-muted-foreground">
        <p className="font-medium">Terms & Conditions</p>
        <ul className="mt-1 list-disc pl-4 space-y-0.5">
          <li>This is a computer-generated receipt and does not require a physical signature.</li>
          <li>For any queries, please contact {company?.email ?? "support@clinic.com"}.</li>
          <li>Subject to local jurisdiction.</li>
        </ul>
        <p className="mt-2 text-center text-[10px]">
          Thank you for choosing {company?.name ?? "our services"}.
        </p>
      </div>
    </div>
  );
}
