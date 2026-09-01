import { useEffect } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setDateRange, selectDateRange } from "@/store/date-range-filter-slice";

/**
 * validateSearch shape for routes that support the global date-range filter.
 * Use this in route definitions:
 *
 *   validateSearch: dateRangeSearchValidator,
 */
export function dateRangeSearchValidator(search: Record<string, unknown>): { from?: string; to?: string } {
  return {
    from: typeof search.from === "string" ? search.from : undefined,
    to: typeof search.to === "string" ? search.to : undefined,
  };
}

/**
 * Hook to sync the global date-range Redux state with URL search params.
 * Call this in any page component whose route declares `validateSearch: dateRangeSearchValidator`.
 *
 * On mount: if URL has from/to → push to Redux (URL wins).
 * On picker change: push from/to into URL via navigate().
 */
export function useDateRangeSync() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as Record<string, string | undefined>;
  const dateRange = useAppSelector(selectDateRange);

  const urlFrom = typeof search.from === "string" ? search.from : undefined;
  const urlTo = typeof search.to === "string" ? search.to : undefined;

  // On mount / URL change → sync URL → Redux
  useEffect(() => {
    const urlHasValues = !!urlFrom || !!urlTo;
    const reduxHasValues = !!dateRange.from || !!dateRange.to;

    // URL wins on load: if URL has values and Redux doesn't, push URL → Redux
    if (urlHasValues && !reduxHasValues) {
      dispatch(setDateRange({ from: urlFrom ?? null, to: urlTo ?? null }));
      return;
    }

    // If both have values but differ, URL wins
    if (urlHasValues && reduxHasValues && (urlFrom !== dateRange.from || urlTo !== dateRange.to)) {
      dispatch(setDateRange({ from: urlFrom ?? null, to: urlTo ?? null }));
    }
  }, [urlFrom, urlTo]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Update both Redux and URL when the picker changes.
   * Use this instead of dispatching directly.
   */
  function updateDateRange(from: string | null, to: string | null) {
    dispatch(setDateRange({ from, to }));
    const next: Record<string, string | undefined> = { ...(search as Record<string, string | undefined>) };
    if (from) next.from = from; else delete next.from;
    if (to) next.to = to; else delete next.to;
    navigate({ search: next as never, replace: true });
  }

  return { dateRange, updateDateRange };
}
