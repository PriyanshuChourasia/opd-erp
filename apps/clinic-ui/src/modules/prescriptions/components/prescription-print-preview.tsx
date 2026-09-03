import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getPatientName } from "@/lib/api";

export interface PrescriptionPreviewItem {
  id?: string;
  medicineName: string;
  dosage: string;
  duration?: string | null;
  quantity: number;
  instructions?: string | null;
}

export interface PrescriptionPreviewData {
  /** Omitted for an unsaved draft (e.g. previewing before the prescription is created). */
  id?: string;
  createdAt?: string | Date;
  patient?: { firstName: string; middleName?: string | null; lastName: string; contactNo?: string | null; email?: string | null } | null;
  doctor?: { name?: string | null; medicalRegistrationNo?: string | null; qualification?: string | null; specialization?: string | null } | null;
  diagnosis?: string | null;
  notes?: string | null;
  items: PrescriptionPreviewItem[];
}

function rxNumber(data: PrescriptionPreviewData): string {
  return data.id ? data.id.slice(0, 8).toUpperCase() : "DRAFT";
}

function formattedRxDate(data: PrescriptionPreviewData): string {
  return new Date(data.createdAt ?? Date.now()).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}

/**
 * Self-contained prescription body markup — every style is inline (no Tailwind classes, no CSS
 * custom properties) so it renders identically in a Word document and an isolated PDF-capture
 * iframe. Clinic/doctor branding lives entirely in header.png/footer.png (apps/clinic-ui/public)
 * rather than being composed from live organisation data — image URLs are origin-qualified so
 * they still resolve when the markup is opened externally (e.g. a downloaded .doc file).
 */
export function buildPrescriptionBodyHtml(data: PrescriptionPreviewData): string {
  const origin = window.location.origin;
  const patientName = data.patient ? getPatientName(data.patient) : "";
  const patientPhone = data.patient?.contactNo ?? "";
  const patientEmail = data.patient?.email ?? "";
  const doctorName = data.doctor?.name ?? data.doctor?.medicalRegistrationNo ?? "";
  const doctorQual = data.doctor?.qualification ?? "";
  const doctorSpec = data.doctor?.specialization ?? "";
  const doctorRegNo = data.doctor?.medicalRegistrationNo ?? "";
  const headerMetaLine = [`Date: ${formattedRxDate(data)}`, doctorRegNo ? `Reg. No: ${doctorRegNo}` : ""].filter(Boolean).join(" &nbsp;|&nbsp; ");

  const medicineRows = data.items.map((item, idx) => `
      <tr>
        <td style="border:1px solid #ddd;padding:6px 8px;text-align:center;font-size:11px;color:#666;">${idx + 1}</td>
        <td style="border:1px solid #ddd;padding:6px 8px;font-weight:bold;font-size:12px;">${item.medicineName}</td>
        <td style="border:1px solid #ddd;padding:6px 8px;font-size:12px;">${item.dosage}</td>
        <td style="border:1px solid #ddd;padding:6px 8px;font-size:12px;">${item.duration || "—"}</td>
        <td style="border:1px solid #ddd;padding:6px 8px;text-align:center;font-size:12px;">${item.quantity}</td>
        <td style="border:1px solid #ddd;padding:6px 8px;font-size:11px;color:#555;">${item.instructions || "—"}</td>
      </tr>`).join("");

  const diagnosisSection = data.diagnosis
    ? `<div style="margin-bottom:16px;">
         <div style="font-weight:bold;color:#1e3a5f;border-bottom:1px solid #ddd;margin-bottom:6px;font-size:11px;letter-spacing:1px;padding-bottom:4px;">DIAGNOSIS</div>
         <p style="margin:0;font-size:13px;">${data.diagnosis}</p>
       </div>`
    : "";

  const notesSection = data.notes
    ? `<div style="margin-bottom:16px;">
         <div style="font-weight:bold;color:#1e3a5f;border-bottom:1px solid #ddd;margin-bottom:6px;font-size:11px;letter-spacing:1px;padding-bottom:4px;">NOTES</div>
         <p style="margin:0;font-size:12px;">${data.notes}</p>
       </div>`
    : "";

  return `<div style="width:100%;font-family:Arial,Helvetica,sans-serif;color:#000;">
  <img src="${origin}/header.png" alt="" style="display:block;width:100%;height:auto;" />
  <div style="padding:20px 24px;">
    <div style="margin-bottom:14px;font-size:11px;color:#666;display:flex;justify-content:space-between;">
      <span>Rx No: <span style="font-family:monospace;font-weight:bold;">${rxNumber(data)}</span></span>
      <span>${headerMetaLine}</span>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:13px;">
      <tr>
        <td style="width:50%;vertical-align:top;padding-right:12px;">
          <div style="font-weight:bold;color:#1e3a5f;border-bottom:1px solid #ddd;margin-bottom:6px;padding-bottom:4px;font-size:11px;letter-spacing:1px;">PATIENT DETAILS</div>
          <div style="font-weight:bold;font-size:13px;margin-bottom:3px;">${patientName}</div>
          ${patientPhone ? `<div style="font-size:12px;color:#444;margin-bottom:2px;">Phone: ${patientPhone}</div>` : ""}
          ${patientEmail ? `<div style="font-size:12px;color:#444;">Email: ${patientEmail}</div>` : ""}
        </td>
        <td style="width:50%;vertical-align:top;padding-left:12px;">
          <div style="font-weight:bold;color:#1e3a5f;border-bottom:1px solid #ddd;margin-bottom:6px;padding-bottom:4px;font-size:11px;letter-spacing:1px;">PRESCRIBED BY</div>
          <div style="font-weight:bold;font-size:13px;margin-bottom:3px;">Dr. ${doctorName}</div>
          ${doctorQual ? `<div style="font-size:12px;color:#444;margin-bottom:2px;">${doctorQual}</div>` : ""}
          ${doctorSpec ? `<div style="font-size:12px;color:#444;">${doctorSpec}</div>` : ""}
        </td>
      </tr>
    </table>
    ${diagnosisSection}
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px;font-size:12px;">
      <thead>
        <tr style="background:#f0f2f5;">
          <th style="border:1px solid #ccc;padding:7px 8px;text-align:left;font-weight:bold;color:#1e3a5f;font-size:11px;letter-spacing:0.5px;">SL.No.</th>
          <th style="border:1px solid #ccc;padding:7px 8px;text-align:left;font-weight:bold;color:#1e3a5f;font-size:11px;letter-spacing:0.5px;width:30%;">MEDICINE</th>
          <th style="border:1px solid #ccc;padding:7px 8px;text-align:left;font-weight:bold;color:#1e3a5f;font-size:11px;letter-spacing:0.5px;width:15%;">DOSAGE</th>
          <th style="border:1px solid #ccc;padding:7px 8px;text-align:left;font-weight:bold;color:#1e3a5f;font-size:11px;letter-spacing:0.5px;width:15%;">DURATION</th>
          <th style="border:1px solid #ccc;padding:7px 8px;text-align:left;font-weight:bold;color:#1e3a5f;font-size:11px;letter-spacing:0.5px;width:10%;">QTY</th>
          <th style="border:1px solid #ccc;padding:7px 8px;text-align:left;font-weight:bold;color:#1e3a5f;font-size:11px;letter-spacing:0.5px;">INSTRUCTIONS</th>
        </tr>
      </thead>
      <tbody>
        ${medicineRows}
      </tbody>
    </table>
    ${notesSection}
    <div style="margin-top:20px;display:flex;justify-content:flex-end;">
      <div style="text-align:center;">
        <div style="width:180px;border-top:1px solid #000;margin-bottom:4px;padding-top:6px;">
          <span style="font-size:12px;font-weight:bold;">Dr. ${doctorName}</span>
        </div>
        <div style="font-size:11px;color:#666;">Doctor's Signature &amp; Stamp</div>
      </div>
    </div>
    <div style="margin-top:16px;padding:8px 12px;background:#f8f9fa;border:1px solid #ddd;font-size:9px;color:#888;line-height:1.4;">
      This prescription is valid only for the patient named above. In case of any adverse reaction, please consult your doctor immediately. Keep this prescription for future reference.
    </div>
  </div>
  <img src="${origin}/footer.png" alt="" style="display:block;width:100%;height:auto;" />
</div>`;
}

/** Full HTML document (Word-compatible) wrapping {@link buildPrescriptionBodyHtml} — used for Export Word. */
export function buildPrescriptionDocumentHtml(data: PrescriptionPreviewData): string {
  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>Medical Prescription</title>
<!--[if gte mso 9]>
<xml>
  <w:WordDocument>
    <w:View>Print</w:View>
  </w:WordDocument>
</xml>
<![endif]-->
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #000; margin: 0; }
  table { border-collapse: collapse; }
  @page { size: A4; margin: 1cm; }
</style>
</head>
<body>
${buildPrescriptionBodyHtml(data)}
</body>
</html>`;
}

function downloadFileNameBase(data: PrescriptionPreviewData, hint?: string): string {
  if (hint) return hint.replace(/\s+/g, "-");
  if (data.patient) return getPatientName(data.patient).replace(/\s+/g, "-");
  return data.id ?? "prescription";
}

export function downloadPrescriptionWord(data: PrescriptionPreviewData, filenameHint?: string) {
  const html = buildPrescriptionDocumentHtml(data);
  const blob = new Blob([html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `prescription-${downloadFileNameBase(data, filenameHint)}.doc`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/**
 * Renders the prescription into an isolated iframe and rasterizes it with html2canvas rather
 * than screenshotting the live preview DOM: html2canvas clones the target element's *own*
 * document, and the app's document uses Tailwind v4's oklch() colors, which html2canvas can't
 * parse — cloning the whole app tree to find them is also what causes a multi-second freeze.
 * A self-contained iframe document (inline-styled, Tailwind-free) sidesteps both.
 */
export async function downloadPrescriptionPdf(data: PrescriptionPreviewData, filenameHint?: string) {
  let iframe: HTMLIFrameElement | null = null;
  try {
    const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
      import("html2canvas"),
      import("jspdf"),
    ]);

    iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;top:-10000px;left:-10000px;width:820px;height:100px;border:0;";
    document.body.appendChild(iframe);
    await new Promise<void>((resolve, reject) => {
      iframe!.onload = () => resolve();
      iframe!.onerror = () => reject(new Error("Failed to load PDF render frame"));
      iframe!.srcdoc = buildPrescriptionDocumentHtml(data);
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
    const imgData = canvas.toDataURL("image/jpeg", 0.95);

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

    const blob = pdf.output("blob");
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prescription-${downloadFileNameBase(data, filenameHint)}.pdf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  } finally {
    iframe?.remove();
  }
}

interface PrescriptionPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: PrescriptionPreviewData | null;
  /** Used to name the downloaded PDF; falls back to the patient's name or the prescription id. */
  filenameHint?: string;
}

/** A4 prescription preview — header/footer are the clinic's branded header.png/footer.png. */
export function PrescriptionPreviewDialog({ open, onOpenChange, data, filenameHint }: PrescriptionPreviewDialogProps) {
  const [generatingPdf, setGeneratingPdf] = useState(false);

  async function handleDownloadPdf() {
    if (!data) return;
    setGeneratingPdf(true);
    try {
      await downloadPrescriptionPdf(data, filenameHint);
      toast.success("PDF downloaded successfully");
    } catch (err) {
      console.error("PDF generation failed", err);
      toast.error("Failed to generate PDF");
    } finally {
      setGeneratingPdf(false);
    }
  }

  const patientName = data?.patient ? getPatientName(data.patient) : "";
  const doctorName = data?.doctor?.name ?? data?.doctor?.medicalRegistrationNo ?? "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto" showCloseButton>
        <DialogHeader>
          <DialogTitle>Prescription Preview</DialogTitle>
        </DialogHeader>

        <div className="overflow-hidden rounded border border-gray-200 bg-white text-black text-[13px] font-[Arial,Helvetica,sans-serif]">
          {data && (
            <>
              <img src="/header.png" alt="" className="block w-full h-auto" />

              <div className="px-6 py-5">
                <div className="mb-3.5 flex justify-between text-[11px] text-gray-500">
                  <span>Rx No: <span className="font-mono font-bold">{rxNumber(data)}</span></span>
                  <span>Date: {formattedRxDate(data)}{data.doctor?.medicalRegistrationNo ? ` | Reg. No: ${data.doctor.medicalRegistrationNo}` : ""}</span>
                </div>

                <table className="w-full border-collapse mb-4 text-[13px]">
                  <tbody>
                    <tr>
                      <td className="w-1/2 align-top pr-3">
                        <div className="font-bold text-[#1e3a5f] border-b border-gray-200 mb-1.5 pb-1 text-[11px] tracking-wide">PATIENT DETAILS</div>
                        <div className="font-bold text-[13px] mb-0.5">{patientName}</div>
                        {data.patient?.contactNo && <div className="text-xs text-gray-600 mb-0.5">Phone: {data.patient.contactNo}</div>}
                        {data.patient?.email && <div className="text-xs text-gray-600">Email: {data.patient.email}</div>}
                      </td>
                      <td className="w-1/2 align-top pl-3">
                        <div className="font-bold text-[#1e3a5f] border-b border-gray-200 mb-1.5 pb-1 text-[11px] tracking-wide">PRESCRIBED BY</div>
                        <div className="font-bold text-[13px] mb-0.5">Dr. {doctorName}</div>
                        {data.doctor?.qualification && <div className="text-xs text-gray-600 mb-0.5">{data.doctor.qualification}</div>}
                        {data.doctor?.specialization && <div className="text-xs text-gray-600">{data.doctor.specialization}</div>}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {data.diagnosis && (
                  <div className="mb-4">
                    <div className="font-bold text-[#1e3a5f] border-b border-gray-200 mb-1.5 pb-1 text-[11px] tracking-wide">DIAGNOSIS</div>
                    <p className="m-0 text-[13px]">{data.diagnosis}</p>
                  </div>
                )}

                <table className="w-full border-collapse mb-4 text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-1.5 text-left font-bold text-[#1e3a5f] text-[11px]">SL.No.</th>
                      <th className="border border-gray-300 p-1.5 text-left font-bold text-[#1e3a5f] text-[11px] w-[30%]">MEDICINE</th>
                      <th className="border border-gray-300 p-1.5 text-left font-bold text-[#1e3a5f] text-[11px] w-[15%]">DOSAGE</th>
                      <th className="border border-gray-300 p-1.5 text-left font-bold text-[#1e3a5f] text-[11px] w-[15%]">DURATION</th>
                      <th className="border border-gray-300 p-1.5 text-left font-bold text-[#1e3a5f] text-[11px] w-[10%]">QTY</th>
                      <th className="border border-gray-300 p-1.5 text-left font-bold text-[#1e3a5f] text-[11px]">INSTRUCTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item, idx) => (
                      <tr key={item.id ?? idx}>
                        <td className="border border-gray-200 p-1.5 text-center text-[11px] text-gray-500">{idx + 1}</td>
                        <td className="border border-gray-200 p-1.5 font-bold text-xs">{item.medicineName}</td>
                        <td className="border border-gray-200 p-1.5 text-xs">{item.dosage}</td>
                        <td className="border border-gray-200 p-1.5 text-xs">{item.duration || "—"}</td>
                        <td className="border border-gray-200 p-1.5 text-center text-xs">{item.quantity}</td>
                        <td className="border border-gray-200 p-1.5 text-[11px] text-gray-600">{item.instructions || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {data.notes && (
                  <div className="mb-4">
                    <div className="font-bold text-[#1e3a5f] border-b border-gray-200 mb-1.5 pb-1 text-[11px] tracking-wide">NOTES</div>
                    <p className="m-0 text-xs">{data.notes}</p>
                  </div>
                )}

                <div className="flex justify-end mt-10">
                  <div className="text-center">
                    <div className="w-44 border-t border-black mb-1 pt-1.5">
                      <span className="text-xs font-bold">Dr. {doctorName}</span>
                    </div>
                    <div className="text-[11px] text-gray-600">Doctor's Signature & Stamp</div>
                  </div>
                </div>

                <div className="mt-4 p-2 bg-gray-50 border border-gray-200 text-[9px] text-gray-500 leading-relaxed">
                  This prescription is valid only for the patient named above. In case of any adverse reaction, please consult your doctor immediately. Keep this prescription for future reference.
                </div>
              </div>

              <img src="/footer.png" alt="" className="block w-full h-auto" />
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button disabled={generatingPdf || !data} onClick={handleDownloadPdf}>
            {generatingPdf ? "Generating…" : "Download PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
