import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Eye, Printer } from "lucide-react";
import {
  fetchBill,
  fetchBillPayments,
  fetchDoctor,
  getPatientName,
  type Bill,
  type Doctor,
  type Organisation,
  type Payment,
} from "@/lib/api";
import { printArea } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PaymentHistory } from "@/components/payment-history";
import { ReceiptViewSheet } from "@/components/receipt-view-sheet";

// ─── Palette (paired with @page invoice-a4 in index.css) ─────────────
const ACCENT = "#0e7490"; // cyan-700 — section headings / accents
const ACCENT_SOFT = "#e9f3f6"; // pale cyan — light panels
const INK = "#0f172a"; // slate-900 — primary text
const MUTED = "#64748b"; // slate-500 — secondary text
const LINE = "#e2e8f0"; // slate-200 — thin separators

const NO_BREAK = "break-inside:avoid;page-break-inside:avoid;";

// ─── Formatting helpers ──────────────────────────────────────────────
function currency(value: number) {
  const v = Number.isFinite(value) ? value : 0;
  return `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/** "2028-05-31T00:00:00.000Z" → "05/2028"; tolerates a comma-joined multi-batch string. */
function formatExpiry(value?: string | null): string {
  if (!value) return "";
  return value
    .split(", ")
    .map((iso) => {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      return `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    })
    .join(" · ");
}

function titleCase(value?: string | null): string {
  if (!value) return "";
  const cleaned = value.replaceAll("_", " ").trim();
  return cleaned.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

function methodLabel(method: string) {
  const map: Record<string, string> = { CASH: "Cash", CARD: "Card", UPI: "UPI", INSURANCE: "Insurance" };
  return map[method] ?? (titleCase(method) || method);
}

function ageFromDob(dob?: string | null): string {
  if (!dob) return "";
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return "";
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const monthDiff = now.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) age--;
  return `${age} yrs`;
}

/** Friendly payment-status label — display only; numeric values stay authoritative. */
function paymentStatusLabel(status: string): string {
  switch (status) {
    case "PAID": return "PAID";
    case "PARTIAL":
    case "PARTIALLY_PAID": return "PARTIALLY PAID";
    case "REFUNDED": return "REFUNDED";
    case "CANCELLED": return "CANCELLED";
    case "PENDING":
    default: return "UNPAID";
  }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Only include items that actually have a charge (zero-value lines are omitted everywhere). */
function billableItems(bill: Bill) {
  return bill.items.filter((item) => item.amount > 0);
}

interface PaymentBreakdown {
  totalPaid: number;
  refunded: number;
  netPaid: number;
  balanceDue: number;
}

/** Sum Payment ledger rows (PAYMENT adds, REFUND subtracts) — same source the backend uses for paidAmount. */
function paymentBreakdown(bill: Bill, payments: Payment[]): PaymentBreakdown {
  const totalPaid = payments.reduce((sum, p) => sum + (p.direction === "PAYMENT" ? p.amount : 0), 0);
  const refunded = payments.reduce((sum, p) => sum + (p.direction === "REFUND" ? p.amount : 0), 0);
  const netPaid = bill.paidAmount ?? Math.max(0, totalPaid - refunded);
  const balanceDue = Math.max(0, bill.total - netPaid);
  return { totalPaid, refunded, netPaid, balanceDue };
}

function medicinesDetail(item: { batchNo?: string | null; expiryDate?: string | null; hsnCode?: string | null }) {
  const expiry = formatExpiry(item.expiryDate);
  return [
    item.batchNo ? `Batch: ${item.batchNo}` : "",
    expiry ? `Exp: ${expiry}` : "",
    item.hsnCode ? `HSN: ${item.hsnCode}` : "",
  ].filter(Boolean).join(" | ");
}

/** Doctor display name — prefers real Doctor record, falls back to the appointment snapshot. */
function doctorDisplayName(doctor?: Doctor | null, bill?: Bill | null): string {
  const raw = doctor?.name ?? bill?.appointment?.doctorName ?? "";
  if (!raw) return "";
  const trimmed = raw.trim();
  return /^dr\.?\s/i.test(trimmed) ? trimmed : `Dr. ${trimmed}`;
}

/**
 * Self-contained invoice markup — every style is inline (no Tailwind classes,
 * no CSS custom properties) so the exact same string renders in the on-screen
 * sheet, the A4 print-preview dialog, and the browser print output (the
 * #print-area in the sheet). Tagged `invoice-print-area` so index.css pins it
 * to @page invoice-a4 (210×297mm portrait).
 */
function buildInvoiceHtml(
  bill: Bill,
  organisation?: Organisation,
  payments: Payment[] = [],
  doctor?: Doctor | null,
): string {
  const items = billableItems(bill);
  const { totalPaid, refunded, netPaid, balanceDue } = paymentBreakdown(bill, payments);
  const statusLabel = paymentStatusLabel(bill.status);

  const billToName = bill.patient ? getPatientName(bill.patient) : "Walk-in customer";
  const ageSex = [ageFromDob(bill.patient?.dateOfBirth), titleCase(bill.patient?.gender)]
    .filter(Boolean)
    .join(" / ");

  // ── Header ──────────────────────────────────────────────────────────
  const headerLeft = `
    <div style="display:flex;align-items:center;gap:14px;min-width:0;">
      ${organisation?.logoUrl ? `<img src="/uploads/documents/${escapeHtml(organisation.logoUrl)}" alt="" style="width:52px;height:52px;object-fit:contain;flex-shrink:0;"/>` : ""}
      <div>
        <div style="font-size:34px;font-weight:800;letter-spacing:1px;color:${ACCENT};line-height:1;">INVOICE</div>
        <div style="margin-top:5px;font-size:10px;font-weight:600;letter-spacing:2.5px;color:${MUTED};">CARE TODAY &bull; HEALTHIER TOMORROW</div>
      </div>
    </div>`;

  const orgLines: string[] = [];
  if (organisation) {
    if (organisation.name) orgLines.push(`<div style="font-weight:700;font-size:15px;color:${INK};">${escapeHtml(organisation.name)}</div>`);
    if (organisation.address) orgLines.push(`<div>${escapeHtml(organisation.address)}</div>`);
    const contactBits = [organisation.phone, organisation.email, organisation.website].filter((v): v is string => Boolean(v));
    if (contactBits.length) orgLines.push(`<div>${contactBits.map(escapeHtml).join(" &bull; ")}</div>`);
    if (organisation.gstNumber) orgLines.push(`<div>GSTIN: <span style="font-weight:600;">${escapeHtml(organisation.gstNumber)}</span></div>`);
    if (organisation.drugLicenseNumber) orgLines.push(`<div>Drug License No.: <span style="font-weight:600;">${escapeHtml(organisation.drugLicenseNumber)}</span></div>`);
  }
  const headerRight = orgLines.length
    ? `<div style="text-align:right;font-size:11px;color:${MUTED};line-height:1.65;">${orgLines.join("")}</div>`
    : "";

  // ── Metadata row ────────────────────────────────────────────────────
  const appointmentLabel = bill.appointment
    ? `${bill.appointment.id.slice(0, 8).toUpperCase()} · ${titleCase(bill.appointment.type)} · ${fmtDate(bill.appointment.date)}`
    : "Walk-in";

  const metaCell = (label: string, value: string, first: boolean) => `
    <div style="flex:1;${first ? "" : `border-left:1px solid ${LINE};padding-left:18px;`}min-width:0;">
      <div style="font-size:10px;font-weight:600;letter-spacing:1.2px;color:${MUTED};text-transform:uppercase;">${label}</div>
      <div style="margin-top:3px;font-size:13px;font-weight:600;color:${INK};line-height:1.4;">${value}</div>
    </div>`;

  const metadataRow = `
    <div style="display:flex;gap:18px;padding:13px 0;border-top:1px solid ${LINE};border-bottom:1px solid ${LINE};">
      ${metaCell("Invoice #", escapeHtml(bill.invoiceNo), true)}
      ${metaCell("Date of Issue", fmtDate(bill.createdAt), false)}
      ${metaCell("OPD / Appointment", appointmentLabel, false)}
    </div>`;

  // ── BILL TO / DOCTOR ────────────────────────────────────────────────
  const doctorName = doctorDisplayName(doctor, bill);
  const doctorQualification = doctor?.qualification ?? null;
  const doctorRegNo = doctor?.medicalRegistrationNo ?? null;
  const doctorSpecialization = doctor?.specialization ?? null;

  const billToBlock = `
    <div style="flex:1;min-width:0;">
      <div style="font-size:10.5px;font-weight:700;letter-spacing:1.2px;color:${ACCENT};text-transform:uppercase;margin-bottom:7px;">Billed To</div>
      <div style="font-size:13px;font-weight:600;color:${INK};">${escapeHtml(billToName)}</div>
      ${ageSex ? `<div style="margin-top:2px;font-size:11.5px;color:${MUTED};">${escapeHtml(ageSex)}</div>` : ""}
      ${bill.patient?.patientCode ? `<div style="margin-top:2px;font-size:11.5px;color:${MUTED};">Patient ID: <span style="color:${INK};">${escapeHtml(bill.patient.patientCode)}</span></div>` : ""}
      ${bill.patient?.contactNo ? `<div style="margin-top:2px;font-size:11.5px;color:${MUTED};">${escapeHtml(bill.patient.contactNo)}</div>` : ""}
      ${bill.patient?.address ? `<div style="margin-top:2px;font-size:11.5px;color:${MUTED};">${escapeHtml(bill.patient.address)}</div>` : ""}
    </div>`;

  const doctorLines: string[] = [];
  if (doctorName) doctorLines.push(`<div style="font-size:13px;font-weight:600;color:${INK};">${escapeHtml(doctorName)}</div>`);
  if (doctorQualification) doctorLines.push(`<div style="margin-top:2px;font-size:11.5px;color:${MUTED};">${escapeHtml(doctorQualification)}</div>`);
  if (doctorRegNo) doctorLines.push(`<div style="margin-top:2px;font-size:11.5px;color:${MUTED};">Reg. No: <span style="color:${INK};">${escapeHtml(doctorRegNo)}</span></div>`);
  if (doctorSpecialization) doctorLines.push(`<div style="margin-top:2px;font-size:11.5px;color:${MUTED};">${escapeHtml(doctorSpecialization)}</div>`);

  const partiesRow = `
    <div style="display:flex;gap:32px;${doctorLines.length ? "justify-content:space-between;" : ""}margin-top:14px;">
      ${billToBlock}
      ${doctorLines.length ? `
        <div style="flex:1;min-width:0;text-align:right;">
          <div style="font-size:10.5px;font-weight:700;letter-spacing:1.2px;color:${ACCENT};text-transform:uppercase;margin-bottom:7px;">Doctor</div>
          ${doctorLines.join("")}
        </div>` : ""}
    </div>`;

  // ── Itemized table ──────────────────────────────────────────────────
  const itemRows = items.map((item) => {
    const detail = item.itemType === "MEDICINE" ? medicinesDetail(item) : "";
    return `
      <tr>
        <td style="padding:8px 10px 8px 0;border-bottom:1px solid ${LINE};vertical-align:top;">
          <div style="font-size:12.5px;font-weight:500;color:${INK};">${escapeHtml(item.itemName)}</div>
          ${detail ? `<div style="margin-top:2px;font-size:10px;color:${MUTED};">${escapeHtml(detail)}</div>` : ""}
        </td>
        <td style="padding:8px 0;border-bottom:1px solid ${LINE};text-align:right;font-size:12px;color:${MUTED};white-space:nowrap;">${currency(item.unitPrice)}</td>
        <td style="padding:8px 0;border-bottom:1px solid ${LINE};text-align:center;font-size:12px;color:${INK};font-weight:500;">${item.quantity}</td>
        <td style="padding:8px 0 8px 0;border-bottom:1px solid ${LINE};text-align:right;font-size:12.5px;font-weight:600;color:${INK};white-space:nowrap;">${currency(item.amount)}</td>
      </tr>`;
  }).join("");

  const itemsTable = `
    <div style="margin-top:18px;${NO_BREAK}">
      <div style="font-size:10.5px;font-weight:700;letter-spacing:1.2px;color:${ACCENT};text-transform:uppercase;margin-bottom:8px;">Billed Items</div>
      <table style="width:100%;border-collapse:collapse;">
        <thead style="display:table-header-group;">
          <tr>
            <th style="padding:6px 10px 6px 0;border-bottom:1.5px solid ${INK};text-align:left;font-size:10px;font-weight:700;letter-spacing:1px;color:${MUTED};text-transform:uppercase;">Description</th>
            <th style="padding:6px 0;border-bottom:1.5px solid ${INK};text-align:right;font-size:10px;font-weight:700;letter-spacing:1px;color:${MUTED};text-transform:uppercase;white-space:nowrap;">Unit Cost</th>
            <th style="padding:6px 0;border-bottom:1.5px solid ${INK};text-align:center;font-size:10px;font-weight:700;letter-spacing:1px;color:${MUTED};text-transform:uppercase;">Qty</th>
            <th style="padding:6px 0 6px 10px;border-bottom:1.5px solid ${INK};text-align:right;font-size:10px;font-weight:700;letter-spacing:1px;color:${MUTED};text-transform:uppercase;white-space:nowrap;">Amount</th>
          </tr>
        </thead>
        <tbody>${itemRows || `<tr><td colspan="4" style="padding:16px 0;font-size:12px;color:${MUTED};text-align:center;">No billable items.</td></tr>`}</tbody>
      </table>
    </div>`;

  // ── Totals ──────────────────────────────────────────────────────────
  const totalBlock = `
    <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:14px;${NO_BREAK}">
      <div>
        <div style="font-size:10.5px;font-weight:700;letter-spacing:1.2px;color:${ACCENT};text-transform:uppercase;">Grand Total</div>
        <div style="margin-top:3px;font-size:27px;font-weight:800;color:${INK};line-height:1.1;">${currency(bill.total)}</div>
      </div>
      <div style="width:235px;font-size:12px;color:${MUTED};">
        <div style="display:flex;justify-content:space-between;padding:4px 0;"><span>Subtotal</span><span style="color:${INK};">${currency(bill.subtotal)}</span></div>
        <div style="display:flex;justify-content:space-between;padding:4px 0;"><span>Discount</span><span style="color:${INK};">${currency(bill.discount)}</span></div>
        <div style="display:flex;justify-content:space-between;padding:4px 0;"><span>Tax</span><span style="color:${INK};">${currency(bill.tax)}</span></div>
        <div style="display:flex;justify-content:space-between;padding:6px 0 4px;border-top:1.5px solid ${INK};font-size:13px;font-weight:700;color:${INK};"><span>Total</span><span>${currency(bill.total)}</span></div>
      </div>
    </div>`;

  // ── Payment summary ─────────────────────────────────────────────────
  const summaryRow = (label: string, value: string, strong = false, tone = INK) => `
    <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:12px;color:${MUTED};">
      <span>${label}</span><span style="font-weight:${strong ? 700 : 500};color:${tone};">${value}</span>
    </div>`;

  const paymentSummary = `
    <div style="margin-top:18px;${NO_BREAK}">
      <div style="font-size:10.5px;font-weight:700;letter-spacing:1.2px;color:${ACCENT};text-transform:uppercase;margin-bottom:8px;">Payment Summary</div>
      <div style="display:flex;gap:24px;justify-content:space-between;align-items:stretch;">
        <div style="flex:1;min-width:0;border:1px solid ${LINE};border-radius:6px;padding:10px 14px;">
          ${summaryRow("Invoice Total", currency(bill.total))}
          ${summaryRow("Total Payments", currency(totalPaid))}
          ${summaryRow("Refunded", currency(refunded), refunded > 0, refunded > 0 ? "#b91c1c" : INK)}
          <div style="display:flex;justify-content:space-between;padding:3px 0;border-top:1px solid ${LINE};margin-top:3px;font-size:12.5px;color:${INK};"><span style="font-weight:700;">Net Paid</span><span style="font-weight:700;">${currency(netPaid)}</span></div>
          <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:12.5px;color:${INK};"><span style="font-weight:700;">Balance Due</span><span style="font-weight:700;">${currency(balanceDue)}</span></div>
        </div>
        <div style="width:180px;flex-shrink:0;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;border:1px solid ${ACCENT};border-radius:6px;background:${ACCENT_SOFT};padding:8px 10px;">
          <div style="font-size:9.5px;font-weight:700;letter-spacing:1.2px;color:${ACCENT};text-transform:uppercase;">Payment Status</div>
          <div style="margin-top:3px;font-size:15px;font-weight:800;color:${ACCENT};letter-spacing:0.5px;">${escapeHtml(statusLabel)}</div>
        </div>
      </div>
    </div>`;

  // ── Payment history (compact, from the actual Payment ledger) ──────
  const paymentRows = payments.length
    ? payments.map((p) => {
        const isRefund = p.direction === "REFUND";
        return `
          <tr>
            <td style="padding:4px 0;font-size:11px;color:${MUTED};white-space:nowrap;">${fmtDate(p.createdAt)}</td>
            <td style="padding:4px 0;font-size:11px;color:${INK};">${escapeHtml(methodLabel(p.method))}</td>
            <td style="padding:4px 0;font-size:11px;color:${MUTED};">${escapeHtml(p.referenceNumber || "—")}</td>
            <td style="padding:4px 0 4px 10px;font-size:11px;font-weight:600;color:${isRefund ? "#b91c1c" : INK};text-align:right;white-space:nowrap;">${isRefund ? "−" : ""}${currency(p.amount)}</td>
          </tr>`;
      }).join("")
    : "";

  const paymentHistory = paymentRows
    ? `
      <div style="margin-top:16px;${NO_BREAK}">
        <div style="font-size:10.5px;font-weight:700;letter-spacing:1.2px;color:${ACCENT};text-transform:uppercase;margin-bottom:6px;">Payment Details</div>
        <table style="width:100%;border-collapse:collapse;">
          <thead style="display:table-header-group;">
            <tr>
              <th style="padding:4px 0;text-align:left;font-size:9.5px;font-weight:700;letter-spacing:1px;color:${MUTED};text-transform:uppercase;">Date</th>
              <th style="padding:4px 0;text-align:left;font-size:9.5px;font-weight:700;letter-spacing:1px;color:${MUTED};text-transform:uppercase;">Method</th>
              <th style="padding:4px 0;text-align:left;font-size:9.5px;font-weight:700;letter-spacing:1px;color:${MUTED};text-transform:uppercase;">Reference</th>
              <th style="padding:4px 0 4px 10px;text-align:right;font-size:9.5px;font-weight:700;letter-spacing:1px;color:${MUTED};text-transform:uppercase;">Amount</th>
            </tr>
          </thead>
          <tbody>${paymentRows}</tbody>
        </table>
      </div>`
    : "";

  // ── Terms & footer ──────────────────────────────────────────────────
  const footer = `
    <div style="margin-top:22px;border-top:1px solid ${LINE};padding-top:12px;display:flex;justify-content:space-between;gap:28px;${NO_BREAK}">
      <div style="flex:1.4;min-width:0;">
        <div style="font-size:10.5px;font-weight:700;letter-spacing:1.2px;color:${ACCENT};text-transform:uppercase;margin-bottom:6px;">Terms &amp; Conditions</div>
        <div style="font-size:10.5px;color:${MUTED};line-height:1.7;">
          <div>1. Medicines once sold are subject to the clinic / pharmacy return policy.</div>
          <div>2. Please retain this invoice for future reference.</div>
          <div>3. For billing queries, contact reception or the pharmacy.</div>
          <div>4. Thank you for trusting our clinic.</div>
        </div>
      </div>
      <div style="flex:1;min-width:0;text-align:right;">
        <div style="font-size:15px;font-weight:800;color:${INK};">Thank you!</div>
        <div style="font-size:11.5px;color:${ACCENT};font-weight:600;margin-top:1px;">Get Well Soon.</div>
        ${organisation?.logoUrl ? `<img src="/uploads/documents/${escapeHtml(organisation.logoUrl)}" alt="" style="margin-top:8px;height:34px;width:auto;max-width:140px;object-fit:contain;"/>` : ""}
      </div>
    </div>`;

  return `
    <div style="font-family:'Inter',ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:${INK};font-size:12.5px;line-height:1.5;background:#ffffff;width:100%;box-sizing:border-box;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:24px;flex-wrap:wrap;">
        ${headerLeft}
        ${headerRight}
      </div>
      ${metadataRow}
      ${partiesRow}
      ${itemsTable}
      ${totalBlock}
      ${paymentSummary}
      ${paymentHistory}
      ${footer}
    </div>`;
}

interface InvoiceViewSheetProps {
  bill: Bill | null;
  onOpenChange: (open: boolean) => void;
  organisation?: Organisation;
  /**
   * True when `bill` is a not-yet-saved synthetic preview (e.g. from the
   * pre-checkout Invoice Preview flow) rather than a real, persisted Bill.
   * Suppresses payment/doctor refetch and receipt lookups — there is no
   * persisted id to fetch against.
   */
  previewOnly?: boolean;
}

/**
 * Shared itemized invoice viewer + print, used from the Billing page, POS and
 * anywhere else a bill needs to be shown (e.g. Appointments row actions) so
 * there is exactly one invoice layout instead of copies drifting apart.
 *
 * The on-screen sheet renders the SAME canonical A4 document that prints:
 * `#print-area` holds the inline-styled markup the browser prints, and the
 * Preview dialog shows the same markup at true A4 size (210×297mm @96dpi).
 * View-only — this sheet never collects or records payment.
 */
export function InvoiceViewSheet({ bill, onOpenChange, organisation, previewOnly = false }: InvoiceViewSheetProps) {
  const [receiptPaymentId, setReceiptPaymentId] = useState<string | null>(null);
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const isReal = !!bill && !previewOnly;
  const billId = bill?.id ?? null;
  const doctorId = bill?.appointment?.doctorId ?? null;

  const { data: freshBill } = useQuery({
    queryKey: ["bill", billId],
    queryFn: () => fetchBill(billId!),
    enabled: isReal && !!billId,
  });
  const { data: payments } = useQuery({
    queryKey: ["bill-payments", billId],
    queryFn: () => fetchBillPayments(billId!),
    enabled: isReal && !!billId,
  });
  const { data: doctor } = useQuery({
    queryKey: ["doctor", doctorId],
    queryFn: () => fetchDoctor(doctorId!),
    enabled: isReal && !!doctorId,
  });

  const displayBill = freshBill ?? bill;
  const doc = displayBill ? buildInvoiceHtml(displayBill, organisation, payments ?? [], doctor) : "";

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
                {/* Print always goes through the preview first — the on-screen
                    layout and the printed page must be the same document, and
                    printing blind from the sheet (where #print-area isn't the
                    focused page) produced blank/garbled output. */}
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setPrintPreviewOpen(true)}>
                  <Printer className="size-3.5" />Print
                </Button>
              </div>
            )}
          </div>
        </SheetHeader>

        {displayBill && (
          <div ref={printAreaRef} id="print-area" className="invoice-print-area">
            <div dangerouslySetInnerHTML={{ __html: doc }} />
          </div>
        )}

        {/* Payment History — internal record-keeping, excluded from the printed invoice.
            Skipped entirely in preview mode: no real bill exists yet, so there's no
            payment history to fetch (and never will be recorded through this sheet). */}
        {displayBill && !previewOnly && (
          <div className="px-4 pb-4 pt-6 text-sm">
            <div className="border-t pt-3">
              <PaymentHistory
                billId={displayBill.id}
                appointmentId={displayBill.appointmentId ?? undefined}
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

      {/* Print Preview Dialog — near-full-viewport modal so the A4-portrait
          page can be reviewed without the modal itself growing & scrolling:
          header and footer stay pinned while only the page area scrolls. The
          page div is sized to the A4-portrait sheet (210×297mm @96dpi → 794×1123px)
          that this invoice prints on — see @page invoice-a4 in index.css. */}
      <Dialog open={printPreviewOpen} onOpenChange={setPrintPreviewOpen}>
        <DialogContent className="flex h-[95vh] w-[95vw] max-w-none flex-col overflow-hidden sm:max-w-none">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto bg-slate-100 p-6">
            {displayBill && (
              <div
                className="mx-auto bg-white"
                style={{ maxWidth: 794, minHeight: 1123, boxShadow: "0 1px 3px rgba(15,23,42,0.2), 0 8px 24px rgba(15,23,42,0.12)" }}
              >
                <div className="px-8 pb-8 pt-9" dangerouslySetInnerHTML={{ __html: doc }} />
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