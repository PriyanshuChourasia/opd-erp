/**
 * Shared A4 prescription export machinery (PDF pagination + download).
 *
 * The exported PDF is built from REAL A4 pages, never from one tall canvas
 * that gets shifted/sliced:
 *
 *   content → measure in the render frame → paginate into fixed 794×1123px
 *   page elements (header.png / title / padded content / footer repeated on
 *   EVERY page) → rasterize each page separately at exactly 794×1123 →
 *   place each raster edge-to-edge on its own A4 (210×297mm) PDF page.
 *
 * A page is only ever created when it has actual content on it, so an empty
 * trailing page can never be produced, and the page count is decided by real
 * content layout — never by Math.ceil over canvas dimensions.
 */

export const PDF_WIDTH_MM = 210;
export const PDF_HEIGHT_MM = 297;
/** A4 portrait raster size (CSS px @96dpi). */
export const PAGE_WIDTH_PX = 794;
export const PAGE_HEIGHT_PX = 1123;

/** Vertical padding (px) of the .page-content area. */
const CONTENT_PAD_Y = 20;

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

/** Resolves once every <img> in the document has finished loading (or failed). */
export async function waitForImages(doc: Document): Promise<void> {
  const images = Array.from(doc.images);
  await Promise.all(images.map((img) => new Promise<void>((resolve) => {
    if (img.complete) { resolve(); return; }
    img.onload = () => resolve();
    img.onerror = () => resolve();
  })));
}

function nextFrame(win: Window): Promise<void> {
  return new Promise<void>((resolve) => {
    win.requestAnimationFrame(() => resolve());
  });
}

/** Chrome repeated verbatim at the top/bottom of every PDF page. */
export interface RxChrome {
  /** Full-bleed top strip (header.png etc.), width:100%. */
  header: string;
  /** Title band directly under the header. */
  title: string;
  /** Full-bleed bottom strip (computer-generated band + footer.png). */
  footer: string;
}

export interface GenerateRxPdfOptions {
  chrome: RxChrome;
  /** Inner content markup (no page/chrome wrapper, no outer padding). */
  contentHtml: string;
  filename: string;
}

function docEl(doc: Document, tag: string, cssText: string): HTMLElement {
  const n = doc.createElement(tag);
  n.style.cssText = cssText;
  return n;
}

export async function generatePaginatedRxPdf(options: GenerateRxPdfOptions): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  let iframe: HTMLIFrameElement | null = null;
  try {
    iframe = document.createElement('iframe');
    iframe.style.cssText = `position:fixed;top:-10000px;left:-10000px;width:${PAGE_WIDTH_PX}px;height:${PAGE_HEIGHT_PX}px;border:0;`;
    document.body.appendChild(iframe);

    iframe.srcdoc = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  html, body { margin: 0 !important; padding: 0 !important; width: 100%; height: 100%; background: #ffffff; }
  * { box-sizing: border-box; }
</style>
</head>
<body>
<div id="rx-pages" style="position:absolute;top:0;left:-10000px;width:794px;"></div>
<div id="rx-scratch" style="display:none;"></div>
</body>
</html>`;
    await new Promise<void>((resolve, reject) => {
      iframe!.onload = () => resolve();
      iframe!.onerror = () => reject(new Error('Failed to load PDF render frame'));
    });

    const doc = iframe.contentDocument;
    if (!doc?.body || !iframe.contentWindow) throw new Error('PDF render frame did not initialize');
    const win = iframe.contentWindow;

    // Parse the reusable chrome fragments once.
    const parseFrag = (html: string): HTMLElement => {
      const w = doc.createElement('div');
      w.innerHTML = html;
      const root = w.firstElementChild as HTMLElement | null;
      if (!root) throw new Error('Empty chrome fragment');
      return root;
    };
    const headerTmpl = parseFrag(options.chrome.header);
    const titleTmpl = parseFrag(options.chrome.title);
    const footerTmpl = parseFrag(options.chrome.footer);

    const host = doc.getElementById('rx-pages') as HTMLElement;

    // Each page is one fixed A4 sheet; content area is a flex region between
    // the chrome strips, and the footer is pinned to the bottom.
    let innerHeightPx = 0;
    const makePage = (): { page: HTMLElement; inner: HTMLElement } => {
      const page = doc.createElement('div');
      page.className = 'prescription-page';
      page.style.cssText =
        `width:${PAGE_WIDTH_PX}px;height:${PAGE_HEIGHT_PX}px;min-width:${PAGE_WIDTH_PX}px;max-width:${PAGE_WIDTH_PX}px;` +
        `min-height:${PAGE_HEIGHT_PX}px;max-height:${PAGE_HEIGHT_PX}px;display:flex;flex-direction:column;` +
        'margin:0;padding:0;box-sizing:border-box;background:#ffffff;overflow:hidden;';

      const header = headerTmpl.cloneNode(true) as HTMLElement;
      header.style.cssText = `${header.style.cssText};width:100%;flex-shrink:0;margin:0;`;
      const title = titleTmpl.cloneNode(true) as HTMLElement;
      title.style.cssText = `${title.style.cssText};width:100%;flex-shrink:0;margin:0;`;

      const content = docEl(doc, 'div',
        'flex:1 1 auto;min-height:0;overflow:hidden;box-sizing:border-box;padding:20px 24px;');
      const inner = docEl(doc, 'div', 'box-sizing:border-box;overflow:hidden;');
      if (innerHeightPx > 0) inner.style.height = `${innerHeightPx}px`;
      content.appendChild(inner);

      const footer = footerTmpl.cloneNode(true) as HTMLElement;
      footer.style.cssText = `${footer.style.cssText};width:100%;flex-shrink:0;margin-top:auto;`;

      page.append(header, title, content, footer);
      host.appendChild(page);
      return { page, inner };
    };

    // Build the first (measurement) page and let its chrome images load, so
    // the real content height is measured from final layout — then reuse it
    // as page 1 (never discard: it holds content).
    const first = makePage();
    await waitForImages(doc);
    await nextFrame(win);
    await nextFrame(win);

    const firstContent = first.page.querySelector('.page-content') as HTMLElement;
    innerHeightPx = Math.max(60, firstContent.clientHeight - CONTENT_PAD_Y * 2);
    first.inner.style.height = `${innerHeightPx}px`;

    const overflow = (): boolean => {
      const i = current.inner;
      return i.scrollHeight > i.clientHeight + 1;
    };
    const startNewPage = (): void => {
      current = makePage();
    };

    let current = { page: first.page, inner: first.inner };

    // Parse the flowing content into top-level blocks.
    const scratch = doc.getElementById('rx-scratch') as HTMLElement;
    scratch.innerHTML = options.contentHtml;
    const blocks = Array.from(scratch.children) as HTMLElement[];

    const placeBlock = (node: HTMLElement): void => {
      current.inner.appendChild(node);
      if (!overflow()) return;
      current.inner.removeChild(node);
      if (current.inner.childElementCount === 0) {
        // A single block taller than a whole page — keep it and let the
        // page's overflow:hidden clip the residual; better than dropping it.
        current.inner.appendChild(node);
        return;
      }
      startNewPage();
      current.inner.appendChild(node);
    };

    // Medicine table: keep the whole table together when it fits; otherwise
    // split at row boundaries and repeat the table header on every page that
    // continues the rows.
    const placeMedTable = (table: HTMLElement): void => {
      const whole = table.cloneNode(true) as HTMLElement;
      current.inner.appendChild(whole);
      if (!overflow()) return;
      current.inner.removeChild(whole);

      const rows = Array.from(table.querySelectorAll('tbody tr')) as HTMLTableRowElement[];
      let open: HTMLElement | null = null;
      for (const row of rows) {
        let placed = false;
        while (!placed) {
          if (!open) {
            const t = table.cloneNode(true) as HTMLElement;
            const tb = t.querySelector('tbody');
            if (tb) while (tb.firstChild) tb.removeChild(tb.firstChild);
            tb!.appendChild(row.cloneNode(true));
            current.inner.appendChild(t);
            if (overflow()) {
              t.remove();
              if (current.inner.childElementCount > 0) {
                startNewPage();
                continue;
              }
              // Cannot fit even on an empty page — keep it (clipped).
              current.inner.appendChild(t);
              open = t;
              placed = true;
              continue;
            }
            open = t;
            placed = true;
          } else {
            const tb = open.querySelector('tbody') as HTMLElement;
            const r = row.cloneNode(true) as HTMLElement;
            tb.appendChild(r);
            if (overflow()) {
              r.remove();
              open = null;
              startNewPage();
            } else {
              placed = true;
            }
          }
        }
      }
    };

    for (const block of blocks) {
      if (block.tagName === 'TABLE' && block.classList.contains('rx-med-table')) {
        placeMedTable(block);
      } else {
        placeBlock(block);
      }
    }

    // Guarantee every page's chrome images are painted before capture.
    await waitForImages(doc);
    await nextFrame(win);
    await nextFrame(win);

    const pages = Array.from(host.querySelectorAll('.prescription-page')) as HTMLElement[];

    // Rasterize each real page once and place it on its own A4 PDF page, in
    // order: page N+1 only exists if page N had real overflowing content.
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
    for (const [index, pageEl] of pages.entries()) {
      if (index > 0) pdf.addPage();
      const canvas = await html2canvas(pageEl, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: false,
        logging: false,
        width: PAGE_WIDTH_PX,
        height: PAGE_HEIGHT_PX,
        windowWidth: PAGE_WIDTH_PX,
        windowHeight: PAGE_HEIGHT_PX,
        scrollX: 0,
        scrollY: 0,
      });
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, PDF_WIDTH_MM, PDF_HEIGHT_MM, undefined, 'FAST');
    }

    const blob = pdf.output('blob');
    downloadBlob(blob, options.filename);
  } finally {
    iframe?.remove();
  }
}
