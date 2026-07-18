import { createFileRoute, redirect } from "@tanstack/react-router";
import { DoctorLayout } from "@/layouts/doctor-layout";
import { store } from "@/store";

const ALLOWED_ROLES = new Set(["DOCTOR", "ADMIN", "SUPER_ADMIN"]);

export const Route = createFileRoute("/_doctor")({
  beforeLoad: () => {
    const { status, user } = store.getState().auth;
    if (status !== "authenticated") {
      throw redirect({ to: "/login" });
    }
    const role = user?.roleName?.toUpperCase();
    if (!role || !ALLOWED_ROLES.has(role)) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: DoctorLayout,
});
