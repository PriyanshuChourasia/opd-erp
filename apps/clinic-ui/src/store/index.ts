import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth-slice";
import dateRangeFilterReducer from "./date-range-filter-slice";
import uiPreferencesReducer from "./ui-preferences-slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dateRangeFilter: dateRangeFilterReducer,
    uiPreferences: uiPreferencesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
