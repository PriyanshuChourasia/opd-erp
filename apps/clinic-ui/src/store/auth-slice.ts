import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type UserableType = 'Doctor' | 'Patient' | 'Nurse' | 'Receptionist' | 'Pharmacist' | 'LabStaff';

export interface AuthUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  roleName: string;
  createdAt?: string;
  permissions: string[];
  userableType?: UserableType | null;
  userableId?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  status: "idle" | "authenticated" | "unauthenticated";
}

function readStoredUser(): AuthUser | null {
  const raw = localStorage.getItem("clinic_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

const storedToken = localStorage.getItem("clinic_access_token");
const storedUser = readStoredUser();

const initialState: AuthState = {
  user: storedUser,
  accessToken: storedToken,
  status: storedToken && storedUser ? "authenticated" : "idle",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: AuthUser; accessToken: string }>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.status = "authenticated";
      localStorage.setItem("clinic_access_token", action.payload.accessToken);
      localStorage.setItem("clinic_user", JSON.stringify(action.payload.user));
    },
    clearCredentials(state) {
      state.user = null;
      state.accessToken = null;
      state.status = "unauthenticated";
      localStorage.removeItem("clinic_access_token");
      localStorage.removeItem("clinic_user");
    },
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
