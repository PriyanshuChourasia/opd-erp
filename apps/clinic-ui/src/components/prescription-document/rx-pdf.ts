import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { paginateRxToPages, waitForStageAssets } from "./rx-paginate";
import type { RxDocData } from "./rx-types";

const W_PX = 794;
const H_PX = 1123;
const W_MM = 210;
const H_MM = 297;

/**
 * Export the shared Rx document model to an A4 portrait PDF.
 *
 * Pagination runs first (same real page model as screen preview + print).
 * Every generated page is its own .rx-page element rendered with header,
 * content and footer, captured once, and placed edge-to-edge on exactly one
 * 210x297mm jsPDF page. No tall canvas, no slicing, no height arithmetic.
 */
export async function generateRxPdf(data: RxDocData): Promise<{ pageCount: number }> {
  const stage = document.createElement("div");
  document.body.appendChild(stage);

  const host = document.createElement("div");
  document.body.appendChild(host);

  try {
    const pagesHtml = await paginateRxToPages(stage, data);

    host.style.cssText =
      `position:fixed;left:-12000px;top:0;width:${W_PX}px;background:#ffffff;z-index:-1;pointer-events:none;`;
    host.innerHTML = pagesHtml.join("");
    await waitForStageAssets(document, host);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    const pageEls = Array.from(host.querySelectorAll<HTMLElement>(".rx-page"));
    if (pageEls.length === 0) throw new Error("No pages were produced");

    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });

    for (let i = 0; i < pageEls.length; i++) {
      const canvas = await html2canvas(pageEls[i]!, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: false,
        logging: false,
        width: W_PX,
        height: H_PX,
        windowWidth: W_PX,
        windowHeight: H_PX,
        scrollX: 0,
        scrollY: 0,
        // html2canvas can't parse oklch() colors ("unsupported color
        // function oklch") and throws the instant it reads one via
        // getComputedStyle. Two independent sources of oklch reach it here:
        // (1) it always reads <html>/<body> background color regardless of
        // capture target, and (2) the Tailwind base layer's `* { border-border
        // outline-ring/50 }` rule gives EVERY element — including our
        // injected .rx-page nodes — a border-color/outline-color that
        // resolves through oklch custom properties, and html2canvas parses
        // every CSS property while walking .rx-page's own subtree. Neither
        // is visible in the captured region (the page's own colors are all
        // inline hex, and nothing in it actually renders a border/outline),
        // so overriding the custom properties to plain hex on the clone is
        // enough to stop the parser ever touching an oklch value.
        onclone: (clonedDoc) => {
          const style = clonedDoc.createElement("style");
          style.textContent = `
            :root, .dark {
              --background:#ffffff; --foreground:#000000; --card:#ffffff; --card-foreground:#000000;
              --popover:#ffffff; --popover-foreground:#000000; --primary:#01aa82; --primary-foreground:#ffffff;
              --secondary:#f5f5f5; --secondary-foreground:#000000; --muted:#f5f5f5; --muted-foreground:#737373;
              --accent:#f5f5f5; --accent-foreground:#000000; --destructive:#dc2626; --destructive-foreground:#ffffff;
              --border:#e5e5e5; --input:#e5e5e5; --ring:#01aa82;
              --chart-1:#01aa82; --chart-2:#8e8e8e; --chart-3:#707070; --chart-4:#5e5e5e; --chart-5:#454545;
              --sidebar:#fafafa; --sidebar-foreground:#000000; --sidebar-primary:#01aa82; --sidebar-primary-foreground:#ffffff;
              --sidebar-accent:#f5f5f5; --sidebar-accent-foreground:#000000; --sidebar-border:#e5e5e5; --sidebar-ring:#01aa82;
            }
          `;
          clonedDoc.head.appendChild(style);
          clonedDoc.documentElement.style.backgroundColor = "#ffffff";
          clonedDoc.documentElement.style.color = "#000000";
          clonedDoc.body.style.backgroundColor = "#ffffff";
          clonedDoc.body.style.color = "#000000";
        },
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      pdf.addImage(imgData, "JPEG", 0, 0, W_MM, H_MM);
      if (i < pageEls.length - 1) pdf.addPage();
    }

    pdf.save(`prescription-${Date.now()}.pdf`);
    return { pageCount: pageEls.length };
  } finally {
    host.remove();
    stage.remove();
  }
}
