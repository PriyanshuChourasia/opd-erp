import { createFileRoute, redirect } from "@tanstack/react-router";
import { PatientLayout } from "@/layouts/patient-layout";
import { store } from "@/store";

export const Route = createFileRoute("/_patient")({
  beforeLoad: () => {
    const { status } = store.getState().auth;
    if (status !== "authenticated") {
      throw redirect({ to: "/login" });
    }
  },
  component: PatientLayout,
});
