/**
 * Shared prescription export helpers.
 *
 * The prescription document model (src/components/prescription-document)
 * owns pagination + rendering for screen, print and PDF; this module only
 * holds the browser-compatible blob download used by the Word (.doc)
 * export and other file downloads.
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