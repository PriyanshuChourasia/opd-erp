import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { paginateRxToPages, waitForStageAssets } from "./rx-paginate";
import type { RxDocData } from "./rx-types";

/** Page gap between A4 sheets in the on-screen preview (px, unscaled). */
export const RX_PREVIEW_GAP = 24;
const GUTTER = 16;

interface RxPrintDocumentProps {
  data: RxDocData;
  /** Called with the mounted #print-area strip once pages are ready & measured. */
  onStripReady?: (el: HTMLElement | null) => void;
}

/**
 * The single DOM source for the prescription document: real, already-paginated
 * `.rx-page` elements inside #print-area. Screen scaling happens ABOVE this
 * root (never inside a page); browser print re-pins each .rx-page to the
 * physical 210x297mm sheet (see index.css).
 */
export function RxPrintDocument({ data, onStripReady }: RxPrintDocumentProps) {
  const stripRef = useRef<HTMLDivElement | null>(null);
  const [pagesHtml, setPagesHtml] = useState<string[] | null>(null);

  useLayoutEffect(() => {
    let cancelled = false;
    // A fresh, detached stage per invocation — not a shared ref reused
    // across re-runs of this effect. React StrictMode (and any legitimate
    // re-run when `data` changes while still paginating, e.g. a slow
    // `organisation` fetch landing after mount) double-invokes this effect;
    // paginateRxToPages does synchronous, unyielding DOM surgery (append/
    // measure/remove) once past its initial asset-wait, so two invocations
    // sharing one stage node stomp on each other's trial pages. Whichever
    // instance's cleanup runs first (`stage.style.cssText = "display:none"`
    // at the end of a completed run) leaves the OTHER, still-running
    // instance's overflow() checks reading 0/0 forever — every block then
    // "fits", and the entire prescription collapses onto a single page.
    // Isolating the stage per invocation means a cancelled run can still
    // finish computing garbage, but its result is simply discarded below.
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

  // Measure the real strip once its images/fonts have settled.
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip || pagesHtml === null) {
      onStripReady?.(null);
      return;
    }
    let cancelled = false;
    waitForStageAssets(document, strip).then(() => {
      requestAnimationFrame(() => {
        if (!cancelled) onStripReady?.(strip);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [pagesHtml]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {pagesHtml === null ? (
        <div className="flex h-full min-h-[300px] w-full items-center justify-center text-sm text-muted-foreground">
          Preparing preview…
        </div>
      ) : (
        <div
          ref={stripRef}
          id="print-area"
          className="rx-print-doc rx-doc-strip flex flex-col items-stretch"
          style={{ width: 794 }}
          dangerouslySetInnerHTML={{
            __html: pagesHtml
              .map((p, i) =>
                i === 0
                  ? p
                  : `<div class="rx-preview-sep" style="height:${RX_PREVIEW_GAP}px;flex-shrink:0;"></div>${p}`,
              )
              .join(""),
          }}
        />
      )}
    </>
  );
}

/**
 * Non-scrolling preview of the whole document (one or many A4 pages).
 *
 * Pages keep their real 794x1123 size inside a strip; ONE scale transform on
 * the strip makes everything fit the viewport. Every page shares the same
 * scale and pages are never individually scrollable. Print neutralizes the
 * scaling wrappers (index.css).
 */
export function RxDocPreview({ data }: { data: RxDocData }) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [stripSize, setStripSize] = useState<{ w: number; h: number } | null>(null);
  const [scale, setScale] = useState(1);

  const handleStripReady = useCallback((el: HTMLElement | null) => {
    if (!el) {
      setStripSize(null);
      return;
    }
    const pages = el.querySelectorAll<HTMLElement>(".rx-page");
    const h =
      Array.from(pages).reduce((sum, p) => sum + p.offsetHeight, 0) +
      Math.max(0, pages.length - 1) * RX_PREVIEW_GAP;
    setStripSize({ w: 794, h });
  }, []);

  // Fallback A4-ish size used to compute a scale before the real strip has
  // been measured — RxPrintDocument must always be mounted (below) for
  // onStripReady to ever fire and replace this with the real size.
  const total = stripSize ?? { w: 794, h: 1123 };

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const update = () => {
      const rect = viewport.getBoundingClientRect();
      // Fit to the viewport's WIDTH only — capped at 1 so a single-page
      // document never gets blown up past its real size. Height is
      // deliberately not part of this: fitting height too (as before) meant
      // a multi-page document's scale was dragged down by its total stacked
      // height, shrinking every page down to an unreadable sliver even
      // though most of the dialog's width sat empty. The viewport scrolls
      // vertically instead (see className below) so page width, not page
      // count, decides how big pages render.
      const s = Math.min((rect.width - GUTTER) / total.w, 1);
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
  }, [total.w]);

  return (
    <div
      ref={viewportRef}
      className="rx-preview-viewport flex min-h-0 min-w-0 flex-1 items-start justify-center overflow-x-hidden overflow-y-auto"
    >
      <div
        className="rx-preview-scaler shrink-0"
        style={{ width: Math.round(total.w * scale), height: Math.round(total.h * scale) }}
      >
        {/* The strip keeps real A4 size; a single transform scales it for
            the screen. Print resets wrappers + transform (index.css).
            RxPrintDocument is mounted unconditionally — it's the only thing
            that ever calls onStripReady, so gating it behind stripSize would
            deadlock (stripSize could never leave its initial null). It shows
            its own "Preparing preview…" placeholder until pagination lands. */}
        <div className="rx-preview-page" style={{ width: 794, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          <RxPrintDocument data={data} onStripReady={handleStripReady} />
        </div>
      </div>
    </div>
  );
}

/** Print the already-paginated Rx document DOM (the shared print button). */
export function printRxDocument() {
  document.getElementById("print-area")?.scrollIntoView({ block: "start" });
  window.scrollTo(0, 0);
  requestAnimationFrame(() => window.print());
}
