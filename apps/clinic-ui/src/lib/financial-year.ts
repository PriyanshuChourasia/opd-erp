import { format } from "date-fns";

const DATE_FORMAT = "yyyy-MM-dd";

/**
 * Indian Financial Year runs Apr 1 – Mar 31.
 * For a date like "2025-06-15", the FY is Apr 2025 – Mar 2026, labeled "FY 2025-26".
 */
export interface FinancialYearRange {
  label: string;
  from: string;
  to: string;
}

function formatDate(d: Date): string {
  return format(d, DATE_FORMAT);
}

/**
 * Returns the Financial Year that contains the given date.
 * Uses India convention: FY starts Apr 1, ends Mar 31 of the next calendar year.
 */
export function getFinancialYear(date: Date): FinancialYearRange {
  const month = date.getMonth(); // 0-indexed (Jan=0, Mar=2, Apr=3, Dec=11)
  const year = date.getFullYear();

  // FY runs Apr 1 → Mar 31. If month >= Apr (3), FY starts this year. Otherwise last year.
  const fyStartYear = month >= 3 ? year : year - 1;
  const fyEndYear = fyStartYear + 1;

  const shortStart = String(fyStartYear).slice(-2);
  const shortEnd = String(fyEndYear).slice(-2);

  return {
    label: `FY ${shortStart}-${shortEnd}`,
    from: formatDate(new Date(fyStartYear, 3, 1)), // Apr 1
    to: formatDate(new Date(fyEndYear, 2, 31)),     // Mar 31
  };
}

/**
 * Returns the current FY plus the previous (count - 1) FYs, newest first.
 * For count=5 returns: FY 2025-26, FY 2024-25, FY 2023-24, FY 2022-23, FY 2021-22
 */
export function getFinancialYearOptions(count = 5): FinancialYearRange[] {
  const current = getFinancialYear(new Date());
  const options: FinancialYearRange[] = [current];

  // Parse the start year from the current FY label to walk backwards
  const currentStartYear = parseInt(current.from.slice(0, 4), 10);

  for (let i = 1; i < count; i++) {
    const startYear = currentStartYear - i;
    const endYear = startYear + 1;
    const shortStart = String(startYear).slice(-2);
    const shortEnd = String(endYear).slice(-2);

    options.push({
      label: `FY ${shortStart}-${shortEnd}`,
      from: formatDate(new Date(startYear, 3, 1)),
      to: formatDate(new Date(endYear, 2, 31)),
    });
  }

  return options;
}
