/**
 * Shared prescription export helpers.
 *
 * PDF export was removed from the app — every print surface now uses the
 * browser print dialog (via printArea()), which also lets the user save as
 * PDF. The only remaining helper here is the browser-compatible blob
 * download used by the Word (.doc) export.
 */

/** Browser-compatible blob download (anchor appended to the DOM). */
export function downloadBlob(blob: Blob, filename: string): void {
  const nav = window.navigator as Navigator & { msSaveOrOpenBlob?: (blob: Blob, filename?: string) => boolean };
  if (nav.msSaveOrOpenBlob) {
    nav.msSaveOrOpenBlob(blob, filename);
    return;
  }
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => { URL.revokeObjectURL(url); }, 10_000);
}