import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { addDays, format, subMonths } from "date-fns";

export interface DateRangeFilterState {
  from: string | null;
  to: string | null;
}

/** Default filter window: one month back from tomorrow, through tomorrow. */
function defaultRange(): DateRangeFilterState {
  const tomorrow = addDays(new Date(), 1);
  return {
    from: format(subMonths(tomorrow, 1), "yyyy-MM-dd"),
    to: format(tomorrow, "yyyy-MM-dd"),
  };
}

const initialState: DateRangeFilterState = defaultRange();

const dateRangeFilterSlice = createSlice({
  name: "dateRangeFilter",
  initialState,
  reducers: {
    setDateRange(state, action: PayloadAction<{ from: string | null; to: string | null }>) {
      state.from = action.payload.from;
      state.to = action.payload.to;
    },
    clearDateRange(state) {
      state.from = null;
      state.to = null;
    },
  },
});

export const { setDateRange, clearDateRange } = dateRangeFilterSlice.actions;
export default dateRangeFilterSlice.reducer;

// Selectors
export const selectDateRange = (state: { dateRangeFilter: DateRangeFilterState }) => state.dateRangeFilter;
export const selectDateRangeFrom = (state: { dateRangeFilter: DateRangeFilterState }) => state.dateRangeFilter.from;
export const selectDateRangeTo = (state: { dateRangeFilter: DateRangeFilterState }) => state.dateRangeFilter.to;
