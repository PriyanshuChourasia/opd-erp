import { createFileRoute, redirect } from "@tanstack/react-router";
import { DoctorLayout } from "@/layouts/doctor-layout";
import { store } from "@/store";

export const Route = createFileRoute("/_doctor")({
  beforeLoad: () => {
    const { status } = store.getState().auth;
    if (status !== "authenticated") {
      throw redirect({ to: "/login" });
    }
  },
  component: DoctorLayout,
});
