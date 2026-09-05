import { RX_A4, RX_FONT, type RxBlock, type RxDocData, type RxDocItem, type RxPageModel } from "./rx-types";

/** Escape user text that is interpolated into HTML. */
export function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Origin-qualified URL so the same HTML works in-app and inside the capture iframe. */
export function rxAssetUrl(path: string): string {
  return new URL(path, window.location.origin).href;
}

const wrap = "overflow-wrap:anywhere;word-break:break-word;";
const cellPad = "padding:6px 8px;box-sizing:border-box;";
const sectionHead =
  "font-weight:bold;color:#1e3a5f;border-bottom:1px solid #ddd;margin-bottom:6px;font-size:11px;letter-spacing:1px;padding-bottom:4px;";

/** Full-bleed /header.png. */
function headerHtml(): string {
  return `<img src="${rxAssetUrl("/header.png")}" alt="" style="width:100%;height:auto;display:block;margin:0;padding:0;border:0;flex-shrink:0;">`;
}

/** Full-bleed computer-generated band + /footer.png (single root element). */
function footerHtml(data: RxDocData): string {
  const extra = [
    data.orgPhone ? `Phone: ${esc(data.orgPhone)}` : "",
    data.orgEmail ? `Email: ${esc(data.orgEmail)}` : "",
  ]
    .filter(Boolean)
    .join(" | ");
  return `<div style="width:100%;flex-shrink:0;box-sizing:border-box;">
  <div style="box-sizing:border-box;width:100%;background:#f0f2f5;padding:8px 24px;text-align:center;font-size:10px;color:#666;border-top:1px solid #ddd;border-bottom:none;">${esc(data.generatedLabel)}${extra ? ` | ${extra}` : ""}</div>
  <img src="${rxAssetUrl("/footer.png")}" alt="" style="width:100%;height:auto;display:block;margin:0;padding:0;border:0;"/>
</div>`;
}

function itemDurationLabel(item: RxDocItem): string {
  return item.duration || "—";
}

/** The medicine-table header strip — repeated on every page where rows continue.
 * flex (not CSS grid) on purpose: html2canvas (used for PDF export) doesn't
 * understand grid-template-columns track sizing and collapses each cell to a
 * near-zero width, which then makes overflow-wrap:anywhere below wrap every
 * cell's text one character per line. Flex items with explicit width +
 * flex-shrink:0 render the same fixed columns in-browser but are widths
 * html2canvas actually honours. */
function medicineHeaderHtml(): string {
  const cell = (w: string, label: string) =>
    `<div style="width:${w};flex-shrink:0;box-sizing:border-box;${cellPad}text-align:left;font-weight:bold;color:#1e3a5f;font-size:11px;letter-spacing:0.5px;border-right:1px solid #ccc;">${label}</div>`;
  return `<div style="width:100%;box-sizing:border-box;display:flex;border:1px solid #ccc;background:#f0f2f5;">
  ${cell("8%", "SL.No.")}
  ${cell("30%", "MEDICINE")}
  ${cell("15%", "DOSAGE")}
  ${cell("15%", "DURATION")}
  ${cell("10%", "QTY")}
  <div style="width:22%;flex-shrink:0;box-sizing:border-box;${cellPad}text-align:left;font-weight:bold;color:#1e3a5f;font-size:11px;letter-spacing:0.5px;">INSTRUCTIONS</div>
</div>`;
}

/** One medicine row — whole rows never split across pages. */
function medicineRowHtml(item: RxDocItem, slNo: number): string {
  const cell = (w: string, inner: string, extra = "") =>
    `<div style="width:${w};flex-shrink:0;box-sizing:border-box;${cellPad}${wrap}vertical-align:top;border-right:1px solid #ccc;${extra}">${inner}</div>`;
  const center = "text-align:center;";
  return `<div style="width:100%;box-sizing:border-box;display:flex;border:1px solid #ccc;border-top:none;">
  ${cell("8%", esc(slNo), center + "color:#666;font-size:11px;")}
  ${cell("30%", `<span style="font-weight:bold;font-size:12px;">${esc(item.medicineName)}</span>`)}
  ${cell("15%", esc(item.dosage || "—"), "font-size:12px;")}
  ${cell("15%", esc(itemDurationLabel(item)), "font-size:12px;")}
  ${cell("10%", esc(item.quantity), center + "font-size:12px;")}
  <div style="width:22%;flex-shrink:0;box-sizing:border-box;${cellPad}${wrap}font-size:11px;color:#555;vertical-align:top;">${esc(item.instructions || "—")}</div>
</div>`;
}

/** Flowing signature row — patient left, doctor right. Placed on the FINAL page only. */
function signatureHtml(data: RxDocData): string {
  return `<div style="margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;width:100%;padding-top:26px;box-sizing:border-box;">
  <div style="width:180px;text-align:center;box-sizing:border-box;">
    <div style="border-top:1px solid #000;padding-top:6px;font-size:11px;color:#333;">Patient Signature</div>
  </div>
  <div style="width:180px;text-align:center;box-sizing:border-box;">
    <div style="border-top:1px solid #000;padding-top:6px;font-size:11px;font-weight:bold;">Dr. ${esc(data.doctorSignatureName)}</div>
    <div style="font-size:10px;color:#666;margin-top:2px;">Doctor's Signature &amp; Stamp</div>
  </div>
</div>`;
}

/** The disclaimer block — always directly ABOVE the signature area. */
function disclaimerHtml(): string {
  return `<div style="width:100%;box-sizing:border-box;margin-top:16px;padding:8px 12px;background:#f8f9fa;border:1px solid #ddd;font-size:9px;color:#888;line-height:1.4;">
  This prescription is valid only for the patient named above. In case of any adverse reaction, please consult your doctor immediately. Keep this prescription for future reference.
</div>`;
}

/**
 * Builds the ordered content blocks for a normalized Rx.
 *
 * Spacing convention: each non-medicine block carries its own bottom margin
 * (medicine rows have none — they tile tightly). Blocks are measured and
 * paginated as flex items, so margins never collapse and measurement exactly
 * matches the final rendering.
 */
export function buildRxBlocks(data: RxDocData): RxBlock[] {
  const blocks: RxBlock[] = [];

  const details: string[] = [`Date: ${esc(data.dateLabel)}`];
  if (data.regNo) details.push(`Reg. No: ${esc(data.regNo)}`);
  blocks.push({
    id: "reference",
    html: `<div style="width:100%;box-sizing:border-box;margin-bottom:14px;font-size:11px;color:#666;display:flex;justify-content:space-between;">
  <span>${esc(data.referenceTitle)}: <span style="font-family:monospace;font-weight:bold;">${esc(data.reference)}</span></span>
  <span>${details.join(" | ")}</span>
</div>`,
  });

  const patientEmail = data.patientEmail
    ? `<div style="font-size:12px;color:#444;${wrap}">Email: ${esc(data.patientEmail)}</div>`
    : "";
  const doctorQual = data.doctorQualification
    ? `<div style="font-size:12px;color:#444;margin-bottom:2px;">${esc(data.doctorQualification)}</div>`
    : "";
  const doctorSpec = data.doctorSpecialization
    ? `<div style="font-size:12px;color:#444;">${esc(data.doctorSpecialization)}</div>`
    : "";
  blocks.push({
    id: "patientDoctor",
    html: `<div style="width:100%;box-sizing:border-box;margin-bottom:16px;">
  <table style="width:100%;table-layout:fixed;border-collapse:collapse;font-size:13px;">
    <tr>
      <td style="width:50%;vertical-align:top;padding-right:12px;${wrap}">
        <div style="${sectionHead}">PATIENT DETAILS</div>
        <div style="font-weight:bold;font-size:13px;margin-bottom:3px;">${esc(data.patientName)}</div>
        ${data.patientPhone ? `<div style="font-size:12px;color:#444;margin-bottom:2px;">Phone: ${esc(data.patientPhone)}</div>` : ""}
        ${patientEmail}
      </td>
      <td style="width:50%;vertical-align:top;padding-left:12px;${wrap}">
        <div style="${sectionHead}">PRESCRIBED BY</div>
        <div style="font-weight:bold;font-size:13px;margin-bottom:3px;">Dr. ${esc(data.doctorName)}</div>
        ${doctorQual}
        ${doctorSpec}
      </td>
    </tr>
  </table>
</div>`,
  });

  if (data.diagnosis) {
    blocks.push({
      id: "diagnosis",
      html: `<div style="width:100%;box-sizing:border-box;margin-bottom:16px;">
  <div style="${sectionHead}">DIAGNOSIS</div>
  <p style="margin:0;font-size:13px;${wrap}">${esc(data.diagnosis)}</p>
</div>`,
    });
  }

  const headerBlock: RxBlock = { id: "medicineHeader", html: medicineHeaderHtml() };
  if (data.items.length > 0) {
    blocks.push(headerBlock);
    data.items.forEach((item, idx) => {
      blocks.push({ id: "medicineRow", html: medicineRowHtml(item, idx + 1) });
    });
  }

  if (data.notes) {
    blocks.push({
      id: "notes",
      html: `<div style="width:100%;box-sizing:border-box;margin-top:16px;margin-bottom:16px;">
  <div style="${sectionHead}">NOTES</div>
  <p style="margin:0;font-size:12px;${wrap}">${esc(data.notes)}</p>
</div>`,
    });
  }

  blocks.push({ id: "disclaimer", html: disclaimerHtml() });

  return blocks;
}

/** Signature block (final page only) + its standalone height probe body. */
export function rxSignatureHtml(data: RxDocData): string {
  return signatureHtml(data);
}

/**
 * Assembles ONE complete A4 .rx-page: header + padded flex body (the given
 * blocks, plus the signature row when `signature`) + footer. Every page —
 * regardless of medium — is built by this function.
 */
export function assembleRxPageHtml(data: RxDocData, blockHtmls: string[], signature: boolean): string {
  const bodyInner = `
    <div style="flex:1 1 auto;min-height:0;display:flex;flex-direction:column;box-sizing:border-box;width:100%;padding:${RX_A4.padY}px ${RX_A4.padX}px;">
      ${blockHtmls.join("\n")}
      ${signature ? rxSignatureHtml(data) : ""}
    </div>`;
  return `<div class="rx-page" data-rx-page style="width:${RX_A4.wPx}px;height:${RX_A4.hPx}px;display:flex;flex-direction:column;box-sizing:border-box;margin:0;padding:0;background:#ffffff;color:#000;font-family:${RX_FONT};overflow:hidden;flex-shrink:0;">
  ${headerHtml()}
  ${bodyInner}
  ${footerHtml(data)}
</div>`;
}

/**
 * Full assembled page list — the end product of pagination. Used by the React
 * renderer (screen + print) and by the PDF exporter.
 */
export function assembleRxPagesHtml(data: RxDocData, pages: RxPageModel[]): string[] {
  return pages.map((p) => assembleRxPageHtml(data, p.blocks, p.signature));
}

/**
 * Word (.doc) adapter: same normalized data, same blocks, same chrome, same
 * order. Word does not reliably honour fixed-height A4 page elements, so the
 * content flows over one continuous sheet (Word paginates it natively) rather
 * than being force-split — an explicit adapter, not a second layout.
 */
export function assembleWordDocumentHtml(data: RxDocData): string {
  const blocks = buildRxBlocks(data);
  const body = `<div style="flex:1 1 auto;min-height:0;display:flex;flex-direction:column;box-sizing:border-box;width:100%;padding:${RX_A4.padY}px ${RX_A4.padX}px;">
    ${blocks.map((b) => b.html).join("\n")}
    ${rxSignatureHtml(data)}
  </div>`;
  const page = `<div style="width:${RX_A4.wPx}px;min-width:${RX_A4.wPx}px;min-height:${RX_A4.hPx}px;display:flex;flex-direction:column;box-sizing:border-box;margin:0;padding:0;background:#ffffff;color:#000;font-family:${RX_FONT};">
    ${headerHtml()}
    ${body}
    ${footerHtml(data)}
  </div>`;
  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>Prescription</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->
<style>
  html, body { margin: 0 !important; padding: 0 !important; width: 100%; height: 100%; background: #ffffff; }
  * { box-sizing: border-box; }
  @page { size: A4 portrait; margin: 0; }
</style>
</head>
<body>
${page}
</body>
</html>`;
}
