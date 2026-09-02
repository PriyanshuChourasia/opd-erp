import { createFileRoute, redirect } from "@tanstack/react-router";
import { PatientLayout } from "@/layouts/patient-layout";
import { store } from "@/store";
import { getHomeRoute } from "@/lib/roles";

export const Route = createFileRoute("/_patient")({
  beforeLoad: () => {
    const { status, user } = store.getState().auth;
    if (status !== "authenticated") {
      throw redirect({ to: "/login" });
    }
    // If user is not a patient role, redirect to their home
    const home = getHomeRoute(user?.roleName);
    if (home !== "/patient") {
      throw redirect({ to: home });
    }
  },
  component: PatientLayout,
});
