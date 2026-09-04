/**
 * THE single prescription document model.
 *
 * Everything below this point renders from one normalized `RxDocData`:
 *   - screen preview (RxDocument + RxPreviewViewport)
 *   - browser print (the same .rx-page DOM, print CSS re-pins it to 210x297mm)
 *   - PDF export (the same page HTML re-measured + captured inside an iframe)
 *   - Word export (the same blocks/chrome, single flowing sheet)
 *
 * A document is an ARRAY OF REAL A4 PAGES. Pagination happens on the data
 * (each page owns its block HTML + whether it carries the signature) before
 * any medium renders it — never by slicing one tall canvas/div.
 */

/** One normalized prescription — no duplicate field mapping anywhere else. */
export interface RxDocData {
  /** e.g. "Rx No" / "Ref" — kept generic so both pages label consistently. */
  referenceTitle: string;
  reference: string;
  dateLabel: string;
  regNo?: string;

  patientName: string;
  patientPhone?: string;
  patientEmail?: string;

  doctorName: string;
  doctorQualification?: string;
  doctorSpecialization?: string;
  /** Doctor name as shown under the signature line. */
  doctorSignatureName: string;

  diagnosis?: string;
  notes?: string;
  items: RxDocItem[];

  /** Footer band copy. */
  generatedLabel: string;
  orgPhone?: string;
  orgEmail?: string;
}

export interface RxDocItem {
  medicineId?: string | null;
  medicineName: string;
  dosage?: string;
  duration?: string;
  quantity?: number;
  instructions?: string;
}

export type RxBlockId =
  | "reference"
  | "patientDoctor"
  | "diagnosis"
  | "medicineHeader"
  | "medicineRow"
  | "notes"
  | "disclaimer";

/** One content block: id (for pagination decisions) + self-contained HTML. */
export interface RxBlock {
  id: RxBlockId;
  html: string;
}

/**
 * A paginated page: the HTML strings that flow inside the page body plus
 * whether this (final) page carries the signature row.
 */
export interface RxPageModel {
  blocks: string[];
  signature: boolean;
}

/** Physical/rendering A4 geometry — the ONLY place these numbers live. */
export const RX_A4 = {
  wPx: 794,
  hPx: 1123,
  wMm: 210,
  hMm: 297,
  contentW: 794 - 40 * 2, // 714 — page padding is 20px 40px on the body only
  padX: 40,
  padY: 20,
} as const;

/** Font stack shared by the page root (React DOM + capture iframe + Word). */
export const RX_FONT = "Arial, Helvetica, sans-serif";
