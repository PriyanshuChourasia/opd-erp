import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

const FONT_SCALE_MIN = 0.85;
const FONT_SCALE_MAX = 1.3;
const FONT_SCALE_STEP = 0.05;
const FONT_SCALE_DEFAULT = 1.0;

interface UiPreferencesState {
  fontScale: number;
  helpModeEnabled: boolean;
}

function readStoredNumber(key: string, fallback: number): number {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  const num = parseFloat(raw);
  return Number.isFinite(num) ? num : fallback;
}

function readStoredBoolean(key: string, fallback: boolean): boolean {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  return raw === "true";
}

const initialState: UiPreferencesState = {
  fontScale: readStoredNumber("clinic_ui_font_scale", FONT_SCALE_DEFAULT),
  helpModeEnabled: readStoredBoolean("clinic_ui_help_mode", true),
};

const uiPreferencesSlice = createSlice({
  name: "uiPreferences",
  initialState,
  reducers: {
    increaseFontScale(state) {
      const next = Math.min(state.fontScale + FONT_SCALE_STEP, FONT_SCALE_MAX);
      state.fontScale = Math.round(next * 100) / 100;
      localStorage.setItem("clinic_ui_font_scale", String(state.fontScale));
    },
    decreaseFontScale(state) {
      const next = Math.max(state.fontScale - FONT_SCALE_STEP, FONT_SCALE_MIN);
      state.fontScale = Math.round(next * 100) / 100;
      localStorage.setItem("clinic_ui_font_scale", String(state.fontScale));
    },
    resetFontScale(state) {
      state.fontScale = FONT_SCALE_DEFAULT;
      localStorage.setItem("clinic_ui_font_scale", String(FONT_SCALE_DEFAULT));
    },
    setHelpModeEnabled(state, action: PayloadAction<boolean>) {
      state.helpModeEnabled = action.payload;
      localStorage.setItem("clinic_ui_help_mode", String(action.payload));
    },
  },
});

export const {
  increaseFontScale,
  decreaseFontScale,
  resetFontScale,
  setHelpModeEnabled,
} = uiPreferencesSlice.actions;

export default uiPreferencesSlice.reducer;

// Selectors
export const selectFontScale = (state: { uiPreferences: UiPreferencesState }) =>
  state.uiPreferences.fontScale;
export const selectHelpModeEnabled = (state: { uiPreferences: UiPreferencesState }) =>
  state.uiPreferences.helpModeEnabled;

// Constants for external use
export { FONT_SCALE_MIN, FONT_SCALE_MAX };
