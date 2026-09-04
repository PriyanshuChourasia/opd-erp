import { useRef, useState } from "react";
import { Eye, Printer } from "lucide-react";
import { getPatientName, type Bill, type Organisation } from "@/lib/api";
import { printArea } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PaymentHistory } from "@/components/payment-history";
import { ReceiptViewSheet } from "@/components/receipt-view-sheet";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  PAID: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  PARTIAL: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  PARTIALLY_PAID: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  REFUNDED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

// Plain hex equivalents of STATUS_STYLES, for the inline-styled print markup
// (which can't use Tailwind's oklch-based utility classes — see buildInvoiceHtml).
const STATUS_HEX: Record<string, { bg: string; fg: string }> = {
  PENDING: { bg: "#fef3c7", fg: "#b45309" },
  PAID: { bg: "#dcfce7", fg: "#15803d" },
  PARTIAL: { bg: "#dbeafe", fg: "#1d4ed8" },
  PARTIALLY_PAID: { bg: "#dbeafe", fg: "#1d4ed8" },
  REFUNDED: { bg: "#f3f4f6", fg: "#4b5563" },
  CANCELLED: { bg: "#fee2e2", fg: "#b91c1c" },
};

function currency(value: number) { const v = Number.isFinite(value) ? value : 0; return `₹${v.toFixed(2)}`; }

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Clinic brand colour used for the invoice header / footer bands. Kept as a
// plain hex so it works in the inline-styled print markup (Tailwind's oklch
// utilities can't be relied on in print).
const BRAND = "#01aa82";
const BRAND_SOFT = "#e6f7f2";

/**
 * Self-contained invoice markup — every style is inline (no Tailwind classes,
 * no CSS custom properties) so it renders cleanly in the print preview and in
 * the browser print output.
 */
function buildInvoiceHtml(bill: Bill, organisation?: Organisation): string {
  const statusHex = STATUS_HEX[bill.status] ?? { bg: "#f3f4f6", fg: "#4b5563" };
  const billToName = bill.patient ? getPatientName(bill.patient) : "Walk-in customer";

  const orgBlock = organisation
    ? `<div style="background:${BRAND};color:#ffffff;border-radius:8px 8px 0 0;padding:14px 20px;margin-bottom:16px;">
         <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;">
           <div style="display:flex;align-items:center;gap:12px;min-width:0;">
             ${organisation.logoUrl ? `<img src="/uploads/documents/${escapeHtml(organisation.logoUrl)}" alt="${escapeHtml(organisation.name)}" style="width:44px;height:44px;object-fit:contain;background:#ffffff;border-radius:6px;padding:2px;flex-shrink:0;"/>` : ""}
             <p style="margin:0;font-weight:700;font-size:16px;line-height:1.3;">${escapeHtml(organisation.name)}</p>
           </div>
           <div style="text-align:right;font-size:11px;color:${BRAND_SOFT};line-height:1.5;">
             ${organisation.address ? `<p style="margin:0 0 2px;">${escapeHtml(organisation.address)}</p>` : ""}
             <p style="margin:0 0 2px;">${escapeHtml([organisation.phone, organisation.email].filter(Boolean).join(" · "))}</p>
             ${organisation.gstNumber ? `<p style="margin:0 0 2px;">GST No: ${escapeHtml(organisation.gstNumber)}</p>` : ""}
             ${organisation.registrationNumber ? `<p style="margin:0;">Reg. No: ${escapeHtml(organisation.registrationNumber)}</p>` : ""}
           </div>
         </div>
       </div>`
    : "";

  const appointmentBlock = bill.appointment
    ? `<div style="border:1px solid #e5e7eb;padding:8px 12px;font-size:11px;color:#6b7280;margin-bottom:16px;border-left:3px solid ${BRAND};">
         ${bill.appointment.doctorName ? `<p style="margin:0 0 2px;">Doctor: <span style="color:#000;">${escapeHtml(bill.appointment.doctorName)}</span></p>` : ""}
         <p style="margin:0 0 2px;">Visit type: <span style="color:#000;">${escapeHtml(bill.appointment.type.replace("_", " "))}</span></p>
         <p style="margin:0;">Visit date: <span style="color:#000;">${new Date(bill.appointment.date).toLocaleDateString()}</span></p>
       </div>`
    : "";

  const itemRows = bill.items.map((item) => `
    <tr>
      <td style="border-bottom:1px solid #e5e7eb;padding:6px 0;font-size:12px;">${escapeHtml(item.itemName)}</td>
      <td style="border-bottom:1px solid #e5e7eb;padding:6px 0;font-size:12px;text-align:center;">${item.quantity}</td>
      <td style="border-bottom:1px solid #e5e7eb;padding:6px 0;font-size:12px;text-align:right;">${currency(item.unitPrice)}</td>
      <td style="border-bottom:1px solid #e5e7eb;padding:6px 0;font-size:12px;text-align:right;">${currency(item.amount)}</td>
    </tr>`).join("");

  const notesBlock = bill.notes
    ? `<div style="border-top:1px solid #e5e7eb;padding-top:8px;margin-top:8px;">
         <p style="margin:0 0 2px;font-size:11px;color:#6b7280;">Notes</p>
         <p style="margin:0;font-size:12px;">${escapeHtml(bill.notes)}</p>
       </div>`
    : "";

  return `<div style="width:100%;font-family:Arial,Helvetica,sans-serif;color:#000;font-size:13px;padding:20px;box-sizing:border-box;">
  ${orgBlock}
  <div style="display:flex;justify-content:space-between;margin-bottom:16px;">
    <div>
      <p style="margin:0;font-size:11px;color:#6b7280;">Bill to</p>
      <p style="margin:2px 0 0;font-weight:500;font-size:13px;">${escapeHtml(billToName)}</p>
      ${bill.patient?.contactNo ? `<p style="margin:2px 0 0;font-size:11px;color:#6b7280;">${escapeHtml(bill.patient.contactNo)}</p>` : ""}
      ${bill.patient?.address ? `<p style="margin:2px 0 0;font-size:11px;color:#6b7280;">${escapeHtml(bill.patient.address)}</p>` : ""}
    </div>
    <div style="text-align:right;">
      <span style="display:inline-block;border-radius:9999px;padding:2px 8px;font-size:10px;font-weight:600;background:${statusHex.bg};color:${statusHex.fg};">${escapeHtml(bill.status)}</span>
      <p style="margin:4px 0 0;font-size:11px;color:#6b7280;">${new Date(bill.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</p>
    </div>
  </div>
  ${appointmentBlock}
  <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
    <thead>
      <tr style="text-align:left;color:#6b7280;">
        <th style="border-bottom:1px solid #e5e7eb;padding-bottom:6px;font-weight:normal;font-size:11px;">Item</th>
        <th style="border-bottom:1px solid #e5e7eb;padding-bottom:6px;font-weight:normal;font-size:11px;width:40px;text-align:center;">Qty</th>
        <th style="border-bottom:1px solid #e5e7eb;padding-bottom:6px;font-weight:normal;font-size:11px;width:80px;text-align:right;">Unit</th>
        <th style="border-bottom:1px solid #e5e7eb;padding-bottom:6px;font-weight:normal;font-size:11px;width:80px;text-align:right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>
  <div style="border-top:1px solid #e5e7eb;padding-top:8px;font-size:12px;color:#6b7280;">
    <div style="display:flex;justify-content:space-between;"><span>Subtotal</span><span>${currency(bill.subtotal)}</span></div>
    ${bill.discount > 0 ? `<div style="display:flex;justify-content:space-between;"><span>Discount</span><span>-${currency(bill.discount)}</span></div>` : ""}
    ${bill.tax > 0 ? `<div style="display:flex;justify-content:space-between;"><span>Tax</span><span>${currency(bill.tax)}</span></div>` : ""}
    <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:600;color:#000;margin-top:2px;"><span>Total</span><span>${currency(bill.total)}</span></div>
    <div style="display:flex;justify-content:space-between;font-size:12px;color:#16a34a;font-weight:600;margin-top:2px;"><span>Paid</span><span>${currency(bill.paidAmount ?? 0)}</span></div>
    ${(bill.total - (bill.paidAmount ?? 0)) > 0 ? `<div style="display:flex;justify-content:space-between;font-size:12px;color:#d97706;font-weight:600;margin-top:2px;"><span>Due</span><span>${currency(bill.total - (bill.paidAmount ?? 0))}</span></div>` : ""}
  </div>
  <div style="display:flex;justify-content:space-between;border-top:1px solid #e5e7eb;padding-top:8px;margin-top:8px;font-size:12px;color:#6b7280;">
    <span>Payment method</span>
    <span style="color:#000;">${escapeHtml(bill.paymentMethod)}</span>
  </div>
  ${notesBlock}
  <div style="background:${BRAND};color:#ffffff;border-radius:0 0 8px 8px;padding:10px 20px;margin-top:16px;display:flex;justify-content:space-between;align-items:center;font-size:11px;">
    <span style="color:${BRAND_SOFT};">Thank you for your visit — please keep this invoice for your records.</span>
    <span style="font-weight:600;">${escapeHtml(bill.invoiceNo)}</span>
  </div>
</div>`;
}

interface InvoiceViewSheetProps {
  bill: Bill | null;
  onOpenChange: (open: boolean) => void;
  organisation?: Organisation;
  /**
   * True when `bill` is a not-yet-saved synthetic preview (e.g. from the
   * pre-checkout Invoice Preview flow) rather than a real, persisted Bill.
   * Suppresses Payment History/receipt lookups, which would otherwise hit
   * the API with a fake id — payment never happens through this sheet
   * regardless of mode, so there's nothing to fetch either way.
   */
  previewOnly?: boolean;
}

/**
 * Shared itemized invoice viewer + print, used from both the Billing page
 * and anywhere else a bill needs to be shown (e.g. Appointments row actions)
 * so there's exactly one invoice layout instead of copies drifting apart.
 * View-only — this sheet never collects or records payment.
 */
export function InvoiceViewSheet({ bill, onOpenChange, organisation, previewOnly = false }: InvoiceViewSheetProps) {
  const [receiptPaymentId, setReceiptPaymentId] = useState<string | null>(null);
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  return (
    <Sheet open={!!bill} onOpenChange={(open) => !open && onOpenChange(false)}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <SheetTitle>{previewOnly ? "Invoice Preview" : `Invoice ${bill?.invoiceNo}`}</SheetTitle>
              <SheetDescription>
                {previewOnly ? "This is a preview — nothing is saved until you generate the invoice." : "Full itemized invoice details."}
              </SheetDescription>
            </div>
            {bill && (
              <div className="flex gap-1.5 shrink-0">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setPrintPreviewOpen(true)}>
                  <Eye className="size-3.5" />Preview
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setPrintPreviewOpen(false); printArea(); }}>
                  <Printer className="size-3.5" />Print
                </Button>
              </div>
            )}
          </div>
        </SheetHeader>
        {bill && (
          <div ref={printAreaRef} id="print-area" className="invoice-print-area space-y-4 px-4 pb-4 text-sm">
            {organisation && (
              <div className="rounded-t-lg bg-[#01aa82] px-5 py-4 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    {organisation.logoUrl && (
                      <img
                        src={`/uploads/documents/${organisation.logoUrl}`}
                        alt={organisation.name}
                        className="size-11 shrink-0 rounded-md bg-white object-contain p-0.5"
                      />
                    )}
                    <p className="font-semibold">{organisation.name}</p>
                  </div>
                  <div className="text-right text-xs leading-relaxed text-emerald-50">
                    {organisation.address && <p>{organisation.address}</p>}
                    <p>{[organisation.phone, organisation.email].filter(Boolean).join(" · ")}</p>
                    {organisation.gstNumber && <p>GST No: {organisation.gstNumber}</p>}
                    {organisation.registrationNumber && <p>Reg. No: {organisation.registrationNumber}</p>}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Bill to</p>
                <p className="font-medium">{bill.patient ? getPatientName(bill.patient) : "Walk-in customer"}</p>
                {bill.patient?.contactNo && <p className="text-xs text-muted-foreground">{bill.patient?.contactNo}</p>}
                {bill.patient?.address && <p className="text-xs text-muted-foreground">{bill.patient.address}</p>}
              </div>
              <div className="text-right">
                <Badge variant="outline" className={`text-[10px] ${STATUS_STYLES[bill.status] ?? ""}`}>{bill.status}</Badge>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(bill.createdAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
            </div>

            {bill.appointment && (
              <div className="rounded-none border px-3 py-2 text-xs text-muted-foreground">
                {bill.appointment.doctorName && <p>Doctor: <span className="text-foreground">{bill.appointment.doctorName}</span></p>}
                <p>Visit type: <span className="text-foreground">{bill.appointment.type.replace("_", " ")}</span></p>
                <p>Visit date: <span className="text-foreground">{new Date(bill.appointment.date).toLocaleDateString()}</span></p>
              </div>
            )}

            <table className="w-full text-xs [&_td]:py-1.5 [&_th]:pb-1.5">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="font-normal">Item</th>
                  <th className="w-10 text-center font-normal">Qty</th>
                  <th className="w-20 text-right font-normal">Unit</th>
                  <th className="w-20 text-right font-normal">Amount</th>
                </tr>
              </thead>
              <tbody>
                {bill.items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td>{item.itemName}</td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-right">{currency(item.unitPrice)}</td>
                    <td className="text-right">{currency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex flex-col gap-0.5 border-t pt-2 text-xs text-muted-foreground">
              <div className="flex justify-between"><span>Subtotal</span><span>{currency(bill.subtotal)}</span></div>
              {bill.discount > 0 && <div className="flex justify-between"><span>Discount</span><span>-{currency(bill.discount)}</span></div>}
              {bill.tax > 0 && <div className="flex justify-between"><span>Tax</span><span>{currency(bill.tax)}</span></div>}
              <div className="flex justify-between text-sm font-semibold text-foreground"><span>Total</span><span>{currency(bill.total)}</span></div>
              <div className="flex justify-between text-xs text-green-600 font-medium"><span>Paid</span><span>{currency(bill.paidAmount ?? 0)}</span></div>
              {(bill.total - (bill.paidAmount ?? 0)) > 0 && (
                <div className="flex justify-between text-xs text-amber-600 font-medium"><span>Due</span><span>{currency(bill.total - (bill.paidAmount ?? 0))}</span></div>
              )}
            </div>

            <div className="flex justify-between border-t pt-2 text-xs text-muted-foreground">
              <span>Payment method</span>
              <span className="text-foreground">{bill.paymentMethod}</span>
            </div>

            {bill.notes && (
              <div className="border-t pt-2">
                <p className="text-xs text-muted-foreground">Notes</p>
                <p className="text-xs">{bill.notes}</p>
              </div>
            )}

            <div className="flex items-center justify-between rounded-b-lg bg-[#01aa82] px-5 py-3 text-xs text-emerald-50">
              <span>Thank you for your visit — please keep this invoice for your records.</span>
              <span className="font-semibold">{bill.invoiceNo}</span>
            </div>
          </div>
        )}

        {/* Payment History — internal record-keeping, excluded from the printed invoice.
            Skipped entirely in preview mode: no real bill exists yet, so there's no
            payment history to fetch (and never will be recorded through this sheet). */}
        {bill && !previewOnly && (
          <div className="space-y-4 px-4 pb-4 text-sm">
            <div className="border-t pt-3">
              <PaymentHistory
                billId={bill.id}
                appointmentId={bill.appointmentId ?? undefined}
                onViewReceipt={(paymentId) => setReceiptPaymentId(paymentId)}
              />
            </div>
          </div>
        )}
      </SheetContent>

      <ReceiptViewSheet
        billId={previewOnly ? null : (bill?.id ?? null)}
        paymentId={receiptPaymentId}
        onOpenChange={(open) => !open && setReceiptPaymentId(null)}
      />

      {/* PDF Preview Dialog */}
      {/* Print Preview Dialog — near-full-viewport modal so the A5-landscape
          page can be reviewed without the modal itself growing & scrolling:
          header and footer stay pinned while only the page area scrolls. The
          page div is sized to the A5-landscape sheet (210x148mm @96dpi) that
          this invoice prints on — see @page invoice-a5 in index.css. */}
      <Dialog open={printPreviewOpen} onOpenChange={setPrintPreviewOpen}>
        <DialogContent className="flex h-[95vh] w-[95vw] max-w-none flex-col overflow-hidden sm:max-w-none">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {bill && (
              <div className="bg-white p-8 mx-auto" style={{ maxWidth: '794px', minHeight: '559px' }}>
                <div dangerouslySetInnerHTML={{ __html: buildInvoiceHtml(bill, organisation) }} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrintPreviewOpen(false)}>Cancel</Button>
            <Button onClick={() => { setPrintPreviewOpen(false); printArea(); }} className="gap-1.5">
              <Printer className="size-3.5" />Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
