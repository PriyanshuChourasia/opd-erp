import { RX_A4, RX_FONT, type RxBlock, type RxDocData } from "./rx-types";
import { buildRxBlocks, rxSignatureHtml } from "./rx-blocks";

/**
 * Real pagination, measured against actual layout.
 *
 * Content blocks are trial-placed into real fixed-height page bodies (header
 * + padded flex body + footer) inside an off-screen stage. Appending a block
 * that would overflow the body (`scrollHeight > clientHeight`) moves it to a
 * fresh page — pages only ever exist with real content, medicine rows never
 * split, and the medicine header repeats on every page where rows continue.
 * The signature is then fitted on the FINAL page (trailing blocks are carried
 * to a new page if they would crowd it).
 *
 * The result is one complete `.rx-page` HTML string per page — the exact same
 * DOM used for screen preview, browser print and PDF capture. No canvas, no
 * `Math.ceil(totalHeight / pageHeight)`, no giant document.
 */

const PAGE_STYLE =
  `width:${RX_A4.wPx}px;height:${RX_A4.hPx}px;display:flex;flex-direction:column;box-sizing:border-box;` +
  `margin:0;padding:0;background:#ffffff;color:#000;font-family:${RX_FONT};overflow:hidden;flex-shrink:0;`;
const HEADER_STYLE = `width:100%;flex-shrink:0;`;
const BODY_STYLE =
  `flex:1 1 auto;min-height:0;display:flex;flex-direction:column;box-sizing:border-box;width:100%;` +
  `padding:${RX_A4.padY}px ${RX_A4.padX}px;`;
const FOOTER_STYLE = `width:100%;flex-shrink:0;box-sizing:border-box;`;

interface PagePart {
  id: string;
  html: string;
}

interface TrialPage {
  root: HTMLElement;
  body: HTMLElement;
  parts: PagePart[];
}

function elFromHtml(doc: Document, html: string): HTMLElement {
  const wrap = doc.createElement("div");
  wrap.innerHTML = html;
  const node = wrap.firstElementChild as HTMLElement | null;
  if (!node) throw new Error("rx block produced no element");
  return node;
}

function headerHtml(): string {
  return `<img src="${new URL("/header.png", window.location.origin).href}" alt="" style="width:100%;height:auto;display:block;margin:0;padding:0;border:0;"/>`;
}

function footerHtml(data: RxDocData): string {
  const extra = [data.orgPhone ? `Phone: ${data.orgPhone}` : "", data.orgEmail ? `Email: ${data.orgEmail}` : ""]
    .filter(Boolean)
    .join(" | ");
  return `<div style="box-sizing:border-box;width:100%;background:#f0f2f5;padding:8px 24px;text-align:center;font-size:10px;color:#666;border-top:1px solid #ddd;">${data.generatedLabel}${extra ? ` | ${extra}` : ""}</div>
<img src="${new URL("/footer.png", window.location.origin).href}" alt="" style="width:100%;height:auto;display:block;margin:0;padding:0;border:0;"/>`;
}

function newTrialPage(doc: Document, data: RxDocData): TrialPage {
  const root = doc.createElement("div");
  root.className = "rx-page";
  root.style.cssText = PAGE_STYLE;
  root.innerHTML = `<div class="rx-page-header" style="${HEADER_STYLE}">${headerHtml()}</div>
<div class="rx-page-body" style="${BODY_STYLE}"></div>
<div class="rx-page-footer" style="${FOOTER_STYLE}">${footerHtml(data)}</div>`;
  const body = root.querySelector(".rx-page-body") as HTMLElement;
  return { root, body, parts: [] };
}

function placeIn(doc: Document, page: TrialPage, part: PagePart): void {
  const el = elFromHtml(doc, part.html);
  el.style.cssText = "flex-shrink:0;" + (el.style.cssText ?? "");
  page.body.appendChild(el);
  page.parts.push(part);
}

function rebuildBody(doc: Document, page: TrialPage): void {
  page.body.innerHTML = "";
  for (const part of page.parts) {
    const el = elFromHtml(doc, part.html);
    el.style.cssText = "flex-shrink:0;" + (el.style.cssText ?? "");
    page.body.appendChild(el);
  }
}

const overflow = (page: TrialPage) => page.body.scrollHeight > page.body.clientHeight;

/** True when the signature was appended and fits. Removes it otherwise. */
function trySignature(doc: Document, page: TrialPage, sigHtml: string): boolean {
  const sig = elFromHtml(doc, sigHtml);
  sig.style.cssText = "flex-shrink:0;" + (sig.style.cssText ?? "");
  page.body.appendChild(sig);
  if (overflow(page)) {
    sig.remove();
    return false;
  }
  return true;
}

/** Wait for images inside the stage + fonts so heights are final. */
export function waitForStageAssets(doc: Document, root: HTMLElement): Promise<void> {
  return new Promise<void>((resolve) => {
    const images = Array.from(root.querySelectorAll("img"));
    if (images.length === 0) {
      resolve();
      return;
    }
    let pending = images.length;
    let done = false;
    const settle = () => {
      if (done) return;
      done = true;
      resolve();
    };
    for (const img of images) {
      if (img.complete) {
        pending -= 1;
        if (pending === 0) settle();
        continue;
      }
      img.addEventListener("load", () => {
        pending -= 1;
        if (pending === 0) settle();
      });
      img.addEventListener("error", () => {
        pending -= 1;
        if (pending === 0) settle();
      });
    }
    window.setTimeout(settle, 3000); // never hang pagination on a stalled image
  }).then(() =>
    doc.fonts && typeof doc.fonts.ready?.then === "function"
      ? doc.fonts.ready.then(() => undefined)
      : undefined,
  );
}

/**
 * Paginate `data` into real A4 pages. `stage` hosts the trial layout; each
 * returned string is a complete `.rx-page` (header, paginated body incl. the
 * final-page signature, footer) ready for screen, print or PDF capture.
 */
export async function paginateRxToPages(stage: HTMLElement, data: RxDocData): Promise<string[]> {
  const doc = stage.ownerDocument ?? document;
  stage.style.cssText = `position:fixed;left:-12000px;top:0;width:${RX_A4.wPx}px;z-index:-1;pointer-events:none;`;

  // Probe chrome (header + footer image) heights with one throwaway page, so
  // pagination below can trust real layout after assets finish loading.
  const probe = newTrialPage(doc, data);
  stage.appendChild(probe.root);
  await waitForStageAssets(doc, stage);
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  probe.root.remove();

  const blocks = buildRxBlocks(data);
  const medicineHeaderHtml = blocks.find((b) => b.id === "medicineHeader")?.html;

  const pages: TrialPage[] = [];
  let current = newTrialPage(doc, data);
  stage.appendChild(current.root);
  pages.push(current);
  let previousEndedMidTable = false;

  for (const block of blocks) {
    placeIn(doc, current, block);

    if (overflow(current)) {
      // This block does not fit on the current page — carry it over.
      current.parts.pop();
      rebuildBody(doc, current);

      previousEndedMidTable = current.parts[current.parts.length - 1]?.id === "medicineRow";

      const finished = current;
      current = newTrialPage(doc, data);
      stage.appendChild(current.root);
      pages.push(current);

      // Repeat the medicine header as the fresh page's first content when
      // it's continuing a table that was cut off mid-page. This has to
      // happen here (once the fresh page actually exists), not at the top
      // of the loop on the next iteration — by then the carried-over block
      // below has already been force-placed, so `current.parts` is never
      // empty when the loop comes back around.
      if (previousEndedMidTable && block.id === "medicineRow" && medicineHeaderHtml) {
        placeIn(doc, current, { id: "medicineHeader", html: medicineHeaderHtml });
      }

      placeIn(doc, current, block); // forced, even when alone on the page
      previousEndedMidTable = block.id === "medicineRow";

      if (overflow(current) && current.parts.length === 2 && current.parts[0]!.id === "medicineHeader") {
        // Pathological: the repeated header plus this one row still don't
        // fit together — drop the header so the row itself is visible; the
        // page clips any remainder (same overflow:hidden behavior as a
        // fixed A4 sheet).
        current.parts.shift();
        rebuildBody(doc, current);
      }
      // Otherwise, if a single block is taller than the body, it's simply
      // left as the page's only content — overflow:hidden on the page
      // clips the remainder (same as a fixed A4 sheet always has).
      void finished;
    }
  }

  // Drop trailing empty pages (defensive).
  while (pages.length > 1 && pages[pages.length - 1]!.parts.length === 0) {
    pages.pop()!.root.remove();
  }

  // ── Signature on the final page only ──
  const sigHtml = rxSignatureHtml(data);
  if (!trySignature(doc, pages[pages.length - 1]!, sigHtml)) {
    // Final page too full: carry its last content block onto a fresh final
    // page. If even that block alone cannot share the page with the signature,
    // the signature gets its own final page.
    const last = pages[pages.length - 1]!;
    const moved = last.parts.pop();
    rebuildBody(doc, last);
    if (last.parts.length === 0) {
      last.root.remove();
      pages.pop();
    }

    const fresh = newTrialPage(doc, data);
    stage.appendChild(fresh.root);
    pages.push(fresh);
    if (moved) placeIn(doc, fresh, moved);

    if (fresh.parts.length === 0 || !trySignature(doc, fresh, sigHtml)) {
      const sigPage = newTrialPage(doc, data);
      stage.appendChild(sigPage.root);
      pages.push(sigPage);
      trySignature(doc, sigPage, sigHtml);
    }
  }

  // Serialize complete pages and clean the stage.
  const result: string[] = [];
  for (const page of pages) {
    result.push(page.root.outerHTML);
    page.root.remove();
  }
  stage.style.cssText = "display:none;";
  return result;
}

/** Convenience for callers that want the count (validation/toasts). */
export type { RxBlock };
