import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Printer } from "lucide-react";
import { toast } from "sonner";
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

// Plain hex equivalents of STATUS_STYLES, for the inline-styled PDF markup
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

/**
 * Self-contained invoice markup — every style is inline (no Tailwind classes,
 * no CSS custom properties) so it renders in an isolated iframe for PDF
 * capture without html2canvas choking on Tailwind v4's oklch() colors (see
 * the identical pattern/reasoning in prescriptions-page.tsx's
 * buildPrescriptionBodyHtml).
 */
function buildInvoiceHtml(bill: Bill, organisation?: Organisation): string {
  const statusHex = STATUS_HEX[bill.status] ?? { bg: "#f3f4f6", fg: "#4b5563" };
  const billToName = bill.patient ? getPatientName(bill.patient) : "Walk-in customer";

  const orgBlock = organisation
    ? `<div style="border-bottom:1px solid #e5e7eb;padding-bottom:12px;margin-bottom:16px;">
         <p style="margin:0;font-weight:600;font-size:14px;">${escapeHtml(organisation.name)}</p>
         ${organisation.address ? `<p style="margin:2px 0 0;font-size:11px;color:#6b7280;">${escapeHtml(organisation.address)}</p>` : ""}
         <p style="margin:2px 0 0;font-size:11px;color:#6b7280;">${escapeHtml([organisation.phone, organisation.email].filter(Boolean).join(" · "))}</p>
         ${organisation.registrationNumber ? `<p style="margin:2px 0 0;font-size:11px;color:#6b7280;">Reg. No: ${escapeHtml(organisation.registrationNumber)}</p>` : ""}
       </div>`
    : "";

  const appointmentBlock = bill.appointment
    ? `<div style="border:1px solid #e5e7eb;padding:8px 12px;font-size:11px;color:#6b7280;margin-bottom:16px;">
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
  </div>
  <div style="display:flex;justify-content:space-between;border-top:1px solid #e5e7eb;padding-top:8px;margin-top:8px;font-size:12px;color:#6b7280;">
    <span>Payment method</span>
    <span style="color:#000;">${escapeHtml(bill.paymentMethod)}</span>
  </div>
  ${notesBlock}
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
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Clean up object URL on unmount or when preview closes
  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    };
  }, [pdfPreviewUrl]);

  const generatePdf = useCallback(async () => {
    if (!bill) return;
    setPdfGenerating(true);
    let iframe: HTMLIFrameElement | null = null;
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      // Render into an isolated iframe rather than screenshotting the live
      // Sheet DOM: html2canvas clones the target element's *own* document,
      // and this app's document uses Tailwind v4's oklch() colors, which
      // html2canvas can't parse regardless of how many computed-style
      // properties get resolved back to rgb() on the clone (tried that —
      // some color source, likely a pseudo-element, always slips through).
      // An iframe with its own self-contained (inline-styled, Tailwind-free)
      // document sidesteps the problem instead of chasing it. Same pattern
      // as prescriptions-page.tsx's downloadPdfFromPreview.
      iframe = document.createElement("iframe");
      iframe.style.cssText = "position:fixed;top:-10000px;left:-10000px;width:820px;height:100px;border:0;";
      document.body.appendChild(iframe);
      await new Promise<void>((resolve, reject) => {
        iframe!.onload = () => resolve();
        iframe!.onerror = () => reject(new Error("Failed to load PDF render frame"));
        iframe!.srcdoc = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;">${buildInvoiceHtml(bill, organisation)}</body></html>`;
      });
      const doc = iframe.contentDocument;
      if (!doc?.body) throw new Error("PDF render frame did not initialize");
      const contentHeight = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight);
      iframe.style.height = `${contentHeight}px`;

      const canvas = await html2canvas(doc.body, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        windowWidth: 820,
        windowHeight: contentHeight,
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.98);

      const margin = 0.5; // inches
      const pageWidth = 8.27;
      const pageHeight = 11.69; // A4
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const usableHeight = pageHeight - margin * 2;

      const pdf = new jsPDF({ unit: "in", format: "a4", orientation: "portrait" });
      let heightLeft = imgHeight;
      let position = margin;
      pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight);
      heightLeft -= usableHeight;
      while (heightLeft > 0) {
        position = margin - (imgHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight);
        heightLeft -= usableHeight;
      }

      const pdfBlob = pdf.output("blob");
      const url = URL.createObjectURL(pdfBlob);
      setPdfBlob(pdfBlob);
      setPdfPreviewUrl(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Could not generate the PDF. Please try again or use Print instead.");
    } finally {
      iframe?.remove();
      setPdfGenerating(false);
    }
  }, [bill, organisation]);

  const downloadPdf = useCallback(() => {
    if (!pdfBlob || !bill) return;
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Invoice-${bill.invoiceNo}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setPdfPreviewUrl(null);
    setPdfBlob(null);
  }, [pdfBlob, bill]);

  const closePdfPreview = useCallback(() => {
    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    setPdfPreviewUrl(null);
    setPdfBlob(null);
  }, [pdfPreviewUrl]);

  return (
    <Sheet open={!!bill} onOpenChange={(open) => !open && onOpenChange(false)}>
      <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
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
                <Button variant="outline" size="sm" className="gap-1.5" onClick={printArea}>
                  <Printer className="size-3.5" />Print
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={generatePdf} disabled={pdfGenerating}>
                  <Download className="size-3.5" />{pdfGenerating ? "Generating…" : "PDF"}
                </Button>
              </div>
            )}
          </div>
        </SheetHeader>
        {bill && (
          <div ref={printAreaRef} id="print-area" className="space-y-4 px-4 pb-4 text-sm">
            {organisation && (
              <div className="border-b pb-3">
                <p className="font-semibold">{organisation.name}</p>
                {organisation.address && <p className="text-xs text-muted-foreground">{organisation.address}</p>}
                <p className="text-xs text-muted-foreground">
                  {[organisation.phone, organisation.email].filter(Boolean).join(" · ")}
                </p>
                {organisation.registrationNumber && (
                  <p className="text-xs text-muted-foreground">Reg. No: {organisation.registrationNumber}</p>
                )}
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
      <Dialog open={!!pdfPreviewUrl} onOpenChange={(open) => !open && closePdfPreview()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-auto rounded border">
            {pdfPreviewUrl && (
              <iframe
                src={pdfPreviewUrl}
                className="h-[60vh] w-full"
                title="PDF Preview"
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closePdfPreview}>Cancel</Button>
            <Button onClick={downloadPdf} className="gap-1.5">
              <Download className="size-3.5" />Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}
