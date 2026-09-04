import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Screen A4 portrait geometry in CSS px @96dpi (210mm x 297mm = 794 x 1123px). */
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;
/** Breathing room around the scaled page inside the viewport (px). */
const GUTTER_PX = 12;

/**
 * Visual preview of ONE A4 page that always fits inside the available space.
 *
 * The page keeps its real 794 x 1123px size and is scaled down with
 * `transform: scale()` when the dialog is smaller — the A4 aspect ratio is
 * never distorted and the page is never made scrollable. Content that would
 * exceed a single A4 sheet is clipped at the sheet boundary (the preview is
 * a one-page preview, exactly like the printed output).
 *
 * The scaling is a SCREEN-ONLY effect. The print stylesheet resets the
 * wrapper boxes and the transform (see the `.rx-preview-*` rules in
 * index.css), and the Rx print rules pin #print-area to the physical
 * 210mm x 297mm sheet.
 */
export function A4Preview({ children, className }: { children: ReactNode; className?: string }) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const s = Math.min(
        (rect.width - GUTTER_PX) / A4_WIDTH_PX,
        (rect.height - GUTTER_PX) / A4_HEIGHT_PX,
        1, // never upscale — show the page at true size when there is room
      );
      setScale(Math.max(0.1, s));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      ref={viewportRef}
      className={cn("rx-preview-viewport flex min-h-0 flex-1 items-center justify-center overflow-hidden", className)}
    >
      {/* Reserves the visually-scaled footprint so centering matches the
          scaled page, not the unscaled 794 x 1123 box. */}
      <div
        className="rx-preview-scaler shrink-0"
        style={{ width: Math.round(A4_WIDTH_PX * scale), height: Math.round(A4_HEIGHT_PX * scale) }}
      >
        {/* The page itself stays a true A4 box; only this transform scales it
            for the screen. In print the transform/wrappers are neutralized. */}
        <div
          className="rx-preview-page"
          style={{
            width: A4_WIDTH_PX,
            height: A4_HEIGHT_PX,
            overflow: "hidden",
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
