import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Extract initials (up to 2 chars) from a name string. */
export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Print the page's #print-area, after resetting scroll to the top.
 *
 * #print-area normally lives inside a scrollable Dialog/Sheet
 * (`overflow-y-auto`). The print stylesheet switches that ancestor to
 * `overflow: visible` so the full content prints, but Chrome keeps
 * painting from whatever scrollTop the element had on screen — so if the
 * user scrolled down to review the content before hitting Print, the PDF
 * comes out clipped to that scrolled viewport instead of starting at the
 * top. Resetting scroll first avoids that.
 */
export function printArea() {
  document.getElementById("print-area")?.scrollIntoView({ block: "start" });
  window.scrollTo(0, 0);
  requestAnimationFrame(() => window.print());
}

