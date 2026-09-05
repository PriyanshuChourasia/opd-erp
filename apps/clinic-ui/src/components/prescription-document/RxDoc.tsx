import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { paginateRxToPages, waitForStageAssets } from "./rx-paginate";
import { RX_A4, type RxDocData } from "./rx-types";

const GUTTER = 16;

/**
 * Paginates `data` into the canonical `.rx-page` HTML strings — the ONE
 * source both the print DOM and the on-screen preview render from. A fresh,
 * detached stage per invocation (not a shared ref reused across re-runs):
 * React StrictMode (and any legitimate re-run when `data` changes while
 * still paginating, e.g. a slow `organisation` fetch landing after mount)
 * double-invokes this effect; paginateRxToPages does synchronous, unyielding
 * DOM surgery (append/measure/remove) once past its initial asset-wait, so
 * two invocations sharing one stage node would stomp on each other's trial
 * pages. Isolating the stage per invocation means a cancelled run can still
 * finish computing garbage, but its result is simply discarded below.
 */
function useRxPages(data: RxDocData): string[] | null {
  const [pagesHtml, setPagesHtml] = useState<string[] | null>(null);

  useLayoutEffect(() => {
    let cancelled = false;
    const stage = document.createElement("div");
    stage.setAttribute("aria-hidden", "true");
    document.body.appendChild(stage);
    setPagesHtml(null);
    paginateRxToPages(stage, data).then((pages) => {
      if (!cancelled) setPagesHtml(pages);
    });
    return () => {
      cancelled = true;
      stage.remove();
    };
  }, [data]);

  return pagesHtml;
}

/**
 * The canonical print DOM: every paginated `.rx-page`, concatenated with no
 * separators. Always mounted once pages exist, and always off-screen
 * (fixed, far outside the viewport via the `.rx-print-doc` class in
 * index.css) — it never affects on-screen layout, is never scaled or
 * transformed, and is completely independent of the one-page preview below.
 * `@media print` (index.css) is what brings it into normal flow; nothing at
 * runtime toggles its visibility, so printing never depends on scroll
 * position or on which preview page is currently shown.
 *
 * Portaled directly to `document.body` — NOT rendered inline where
 * RxDocPreview is mounted (inside the Dialog). The Dialog centers itself
 * on screen via `-translate-x-1/2 -translate-y-1/2`, and its print reset
 * (`transform: none !important; translate: none !important;` in index.css)
 * relies on the browser applying BOTH resets. Vite's production CSS
 * minifier collapses those two separate declarations into a single
 * `transform: translate(0) !important`, which cancels `transform` but not
 * the independent standalone `translate` property — so in a production
 * build (never in unminified dev CSS) the dialog's -50%/-50% centering
 * offset survives print and shifts the entire printed page by half the
 * dialog's on-screen size. That's exactly the "only the bottom of the page
 * shows, everything above is blank" symptom: the whole `.rx-page` is
 * shifted up-and-left off the physical sheet, leaving only its bottom-right
 * corner (signature/disclaimer/footer) within the printable area. Rather
 * than trust every ancestor's CSS reset to survive every future minifier,
 * this makes the dependency impossible: the print DOM has NO transformed
 * ancestor to reset in the first place.
 */
function RxPrintRoot({ pagesHtml }: { pagesHtml: string[] }) {
  return createPortal(
    <div
      id="print-area"
      aria-hidden
      className="rx-print-doc"
      style={{ width: RX_A4.wPx }}
      dangerouslySetInnerHTML={{ __html: pagesHtml.join("") }}
    />,
    document.body,
  );
}

interface RxDocPreviewProps {
  data: RxDocData;
  /** Fires with whether the document (all pages + their assets) is ready to print/export. */
  onReady?: (ready: boolean) => void;
}

/**
 * One-page-at-a-time preview of the paginated document, with Previous/Next
 * navigation — never a scrolling stack of every page. The displayed page is
 * scaled uniformly (never distorted) to fit the available width AND height,
 * so it never needs its own scrollbar. This component's DOM has no bearing
 * on print geometry: it renders the same canonical page HTML `RxPrintRoot`
 * does, but as an independent, non-printed copy (see index.css — anything
 * that isn't `#print-area` or one of its ancestors is hidden at print time).
 */
export function RxDocPreview({ data, onReady }: RxDocPreviewProps) {
  const pagesHtml = useRxPages(data);
  const [pageIndex, setPageIndex] = useState(0);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  // Back to page 1 whenever a new document lands (new prescription, or this
  // one just finished re-paginating after an edit).
  useEffect(() => {
    setPageIndex(0);
  }, [pagesHtml]);

  // Ready to print/export once the off-screen print DOM's images (header,
  // footer) and fonts have actually settled — not just once pagination
  // returns HTML strings, since the images inside them are still loading.
  useEffect(() => {
    if (!pagesHtml) {
      onReady?.(false);
      return;
    }
    let cancelled = false;
    const printRoot = document.getElementById("print-area");
    if (!printRoot) {
      onReady?.(false);
      return;
    }
    onReady?.(false);
    waitForStageAssets(document, printRoot).then(() => {
      if (!cancelled) onReady?.(true);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagesHtml]);

  // Scale the single displayed page to fit the viewport in BOTH dimensions
  // — there's only ever one page on screen at a time, so it just needs to
  // fit; nothing needs to scroll, and the aspect ratio is never distorted
  // since both axes share the same scale factor.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const update = () => {
      const rect = viewport.getBoundingClientRect();
      const s = Math.min((rect.width - GUTTER) / RX_A4.wPx, (rect.height - GUTTER) / RX_A4.hPx, 1);
      setScale(Math.max(0.05, s));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(viewport);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  const pageCount = pagesHtml?.length ?? 0;
  const currentPageHtml = pagesHtml?.[pageIndex] ?? null;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div
        ref={viewportRef}
        className="flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden"
      >
        {currentPageHtml === null ? (
          <p className="text-sm text-muted-foreground">Preparing preview…</p>
        ) : (
          <div
            className="shrink-0 overflow-hidden bg-white shadow-sm"
            style={{ width: Math.round(RX_A4.wPx * scale), height: Math.round(RX_A4.hPx * scale) }}
          >
            <div
              // Key forces a remount on page change so a stale previous
              // page's DOM never lingers mid-transition.
              key={pageIndex}
              style={{ width: RX_A4.wPx, height: RX_A4.hPx, transform: `scale(${scale})`, transformOrigin: "top left" }}
              dangerouslySetInnerHTML={{ __html: currentPageHtml }}
            />
          </div>
        )}
      </div>

      {pageCount > 1 && (
        <div className="flex shrink-0 items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pageIndex === 0}
            onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
          >
            <ChevronLeft className="size-3.5" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {pageIndex + 1} of {pageCount}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pageIndex >= pageCount - 1}
            onClick={() => setPageIndex((i) => Math.min(pageCount - 1, i + 1))}
          >
            Next
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      )}

      {pagesHtml && <RxPrintRoot pagesHtml={pagesHtml} />}
    </div>
  );
}

/**
 * Print the canonical, always-off-screen `#print-area` (every page, not
 * just whichever one the preview happens to be showing). No scroll or
 * transform manipulation of any kind: `#print-area` never depends on being
 * scrolled into view or visible on screen — `@media print` (index.css) is
 * solely responsible for bringing it into the page. The only thing this
 * does is make sure its images have actually finished loading (defensive —
 * the Print button is expected to be disabled until `onReady` fires, but a
 * production browser can still race asset loads differently than local dev).
 */
export function printRxDocument() {
  const printRoot = document.getElementById("print-area");
  if (!printRoot) return;
  waitForStageAssets(document, printRoot).then(() => {
    requestAnimationFrame(() => window.print());
  });
}
