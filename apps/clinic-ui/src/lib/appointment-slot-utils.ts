import type { DoctorSlot, SlotWindow } from "@/lib/api";

/** Local date string (YYYY-MM-DD) → short label like "14 Sep". */
export function fmtDateOnly(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr.length === 10 ? `${dateStr}T00:00:00` : dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

/**
 * Human section header for one resolved window:
 * - recurring with a shift → "Morning Shift · 09:00–13:00"
 * - recurring custom      → "09:00–13:00"
 * - one-off exception     → "Extra shift · 17:00–21:00 · 14 Sep only"
 */
export function windowSectionLabel(
  w: Pick<SlotWindow, "windowStart" | "windowEnd" | "shiftName" | "isException" | "exceptionType">,
  date: string,
): string {
  const range = `${w.windowStart}–${w.windowEnd}`;
  if (w.isException) {
    const kind = w.exceptionType === "OVERRIDE" ? "Override" : "Extra shift";
    return `${kind} · ${range} · ${fmtDateOnly(date)} only`;
  }
  return w.shiftName ? `${w.shiftName} · ${range}` : range;
}

/** Ascending "HH:mm" times inside [start, end) at the given interval. */
export function timesInWindow(start: string, end: string, intervalMinutes: number): string[] {
  const toMin = (t: string) => {
    const [h, m] = t.split(":");
    return Number(h) * 60 + Number(m);
  };
  const toTime = (total: number) =>
    `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  const out: string[] = [];
  const startMin = toMin(start);
  const endMin = toMin(end);
  for (let m = startMin; m < endMin; m += intervalMinutes) {
    out.push(toTime(m));
  }
  return out;
}

export interface SlotSection {
  key: string;
  label: string;
  isException: boolean;
  slots: DoctorSlot[];
}

/**
 * Group the backend slot list into sections by (shift, window). Headers are
 * shown for multi-section dates and for one-off exception windows.
 */
export function groupSlotsByWindow(slots: DoctorSlot[], date: string): SlotSection[] {
  const sections = new Map<string, SlotSection>();
  for (const slot of slots) {
    const isException = !!slot.isException;
    const key = [
      isException ? "exc" : "rec",
      slot.shiftName ?? "",
      slot.windowStart ?? "",
      slot.windowEnd ?? "",
    ].join("|");
    const existing = sections.get(key);
    if (existing) {
      existing.slots.push(slot);
      continue;
    }
    sections.set(key, {
      key,
      label: windowSectionLabel(
        {
          windowStart: slot.windowStart ?? "",
          windowEnd: slot.windowEnd ?? "",
          shiftName: slot.shiftName ?? null,
          isException,
          exceptionType: slot.exceptionType ?? null,
        },
        date,
      ),
      isException,
      slots: [slot],
    });
  }
  return [...sections.values()];
}
