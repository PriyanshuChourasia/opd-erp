import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface DateRangeFilterState {
  from: string | null;
  to: string | null;
}

const initialState: DateRangeFilterState = {
  from: null,
  to: null,
};

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
