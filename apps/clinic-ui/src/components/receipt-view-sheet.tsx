import { useQuery } from "@tanstack/react-query";
import { Printer } from "lucide-react";
import { fetchReceipt, type ReceiptData } from "@/lib/api";
import { printArea } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

// Bill/Payment amounts are stored and served in rupees (whole units) — no
// paise division. (Only the accounting/stock modules deal in paise.)
function currency(value: number) {
  const v = Number.isFinite(value) ? value : 0;
  return `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
    <div id="print-area" className="receipt-print-area space-y-2 px-3 pb-3 text-sm">
      <img src="/header.png" alt="" className="invoice-banner-image w-full h-auto" />

      {/* Company Letterhead + Receipt meta, side by side across the wide sheet */}
      <div className="flex items-start justify-between gap-4 border-b pb-2">
        {company && (
          <div className="min-w-0">
            <p className="text-[15px] font-bold tracking-tight">{company.name}</p>
            {company.address && <p className="text-[11px] text-muted-foreground">{company.address}</p>}
            <p className="text-[11px] text-muted-foreground">
              {[company.phone, company.email, company.website].filter(Boolean).join(" · ")}
            </p>
            <div className="mt-1 flex [column-gap:12px] flex-wrap text-[10px] text-muted-foreground">
              {company.gstNumber && <span>GST No: {company.gstNumber}</span>}
              {company.panNumber && <span>PAN: {company.panNumber}</span>}
              {company.cinNumber && <span>CIN: {company.cinNumber}</span>}
            </div>
          </div>
        )}
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold uppercase tracking-widest text-primary">Receipt</p>
          <p className="mt-1 text-[10px] text-muted-foreground">Receipt Number</p>
          <p className="text-sm font-semibold">{receipt.voucherNumber ?? "—"}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">Date</p>
          <p className="text-xs font-medium">{formatDateTime(receipt.voucherDate)}</p>
        </div>
      </div>

      {/* Patient + Service/Payment details, two columns to use the wide sheet */}
      <div className="grid grid-cols-2 items-start gap-2">
        {patient && (
          <div className="rounded-none border p-2.5">
            <p className="mb-1 text-[11px] font-medium uppercase text-muted-foreground">Patient Details</p>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
              <div>
                <p className="text-[11px] text-muted-foreground">Name</p>
                <p className="text-sm font-medium">{patient.name}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">UHID</p>
                <p className="text-sm font-medium">{patient.patientCode}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Contact No.</p>
                <p className="text-sm">{patient.contactNo}</p>
              </div>
              {patient.email && (
                <div>
                  <p className="text-[11px] text-muted-foreground">Email</p>
                  <p className="text-sm">{patient.email}</p>
                </div>
              )}
            </div>
            {address && (
              <div className="mt-1.5 border-t pt-1.5">
                <p className="text-[11px] text-muted-foreground">Address</p>
                <p className="text-xs">
                  {address.line1}
                  {address.line2 ? `, ${address.line2}` : ""}
                  {address.city ? `, ${address.city}` : ""}
                  {address.state ? `, ${address.state}` : ""}
                  {address.postalCode ? ` - ${address.postalCode}` : ""}
                </p>
              </div>
            )}
            <div className="mt-1.5 border-t pt-1.5">
              <p className="text-[11px] text-muted-foreground">Recipient GST No.</p>
              <p className="text-xs">NA (B2C)</p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {/* Doctor & Appointment */}
          {(doctor || bill.appointmentId) && (
            <div className="rounded-none border p-2.5">
              <p className="mb-1 text-[11px] font-medium uppercase text-muted-foreground">Service Details</p>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
                {doctor && (
                  <>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Doctor</p>
                      <p className="text-sm font-medium">{doctor.name}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Speciality</p>
                      <p className="text-sm">{doctor.specialization ?? "—"}</p>
                    </div>
                  </>
                )}
                {bill.appointmentId && (
                  <div>
                    <p className="text-[11px] text-muted-foreground">Appointment ID</p>
                    <p className="font-mono text-xs">{bill.appointmentId.slice(0, 8)}…</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Details */}
          <div className="rounded-none border p-2.5">
            <p className="mb-1 text-[11px] font-medium uppercase text-muted-foreground">Payment Received</p>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
              <div>
                <p className="text-[11px] text-muted-foreground">Amount</p>
                <p className="text-base font-bold text-green-600">{currency(receipt.amount)}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Method</p>
                <p className="text-sm font-medium">{receipt.method}</p>
              </div>
              {receipt.referenceNumber && (
                <div>
                  <p className="text-[11px] text-muted-foreground">Reference</p>
                  <p className="font-mono text-xs">{receipt.referenceNumber}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Line Items Table — full width so descriptions can breathe */}
      <div>
        <p className="mb-0.5 text-[11px] font-medium uppercase text-muted-foreground">Services</p>
        <table className="w-full table-fixed text-xs [&_td]:py-1 [&_th]:pb-1">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="font-normal">Service Name</th>
              <th className="w-16 text-center font-normal">Qty</th>
              <th className="w-24 text-right font-normal">Rate</th>
              <th className="w-24 text-right font-normal">Amount</th>
            </tr>
          </thead>
          <tbody>
            {bill.items.map((item) => (
              <tr key={item.id} className="border-b last:border-0">
                <td>
                  <span className="text-sm font-medium">{item.itemName}</span>
                  <span className="ml-1 text-[11px] text-muted-foreground">({item.itemType})</span>
                </td>
                <td className="text-center">{item.quantity}</td>
                <td className="text-right">{currency(item.unitPrice)}</td>
                <td className="text-right font-medium">{currency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals + Terms, two columns */}
      <div className="grid grid-cols-2 items-end gap-2">
        <div className="flex flex-col gap-0.5 border-t pt-1.5 text-xs text-muted-foreground">
          <div className="flex justify-between"><span>Subtotal</span><span>{currency(bill.subtotal)}</span></div>
          {bill.discount > 0 && (
            <div className="flex justify-between"><span>Less: Discount</span><span className="text-green-600">−{currency(bill.discount)}</span></div>
          )}
          {bill.tax > 0 && (
            <div className="flex justify-between"><span>GST</span><span>{currency(bill.tax)}</span></div>
          )}
          <div className="flex justify-between border-t pt-1.5 text-sm font-bold text-foreground">
            <span>Total Amount</span>
            <span>{currency(bill.total)}</span>
          </div>
        </div>

        {/* Footer / Terms */}
        <div className="border-t pt-1.5 text-[10px] text-muted-foreground">
          <p className="font-medium">Terms & Conditions</p>
          <ul className="mt-0.5 list-disc pl-4 space-y-0.5">
            <li>This is a computer-generated receipt and does not require a physical signature.</li>
            <li>For any queries, please contact {company?.email ?? "support@clinic.com"}.</li>
            <li>Subject to local jurisdiction.</li>
          </ul>
          <p className="mt-1 text-right text-[10px]">
            Thank you for choosing {company?.name ?? "our services"}.
          </p>
        </div>
      </div>

      <img src="/footer.png" alt="" className="invoice-banner-image w-full h-auto" />
    </div>
  );
}
