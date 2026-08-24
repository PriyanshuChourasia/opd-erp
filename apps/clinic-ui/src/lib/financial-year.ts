/**
 * Financial-year helpers (Indian FY runs 1 Apr – 31 Mar).
 * Label derivation must stay in sync with the API's deriveFyLabel().
 */

export function deriveFyLabel(startDateIso: string): string {
  const year = Number(startDateIso.slice(0, 4));
  const month = Number(startDateIso.slice(5, 7));
  const base = month >= 4 ? year : year - 1;
  return `FY ${base}-${String((base + 1) % 100).padStart(2, "0")}`;
}

function currentFyBaseYear(now = new Date()): number {
  return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
}

export function defaultFyStartDate(): string {
  return `${currentFyBaseYear()}-04-01`;
}

export function defaultFyEndDate(): string {
  return `${currentFyBaseYear() + 1}-03-31`;
}
