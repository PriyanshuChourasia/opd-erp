import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppointmentsLayout } from "@/layouts/appointments-layout";
import { store } from "@/store";

export const Route = createFileRoute("/_appointments")({
  beforeLoad: () => {
    const { status } = store.getState().auth;
    if (status !== "authenticated") {
      throw redirect({ to: "/login" });
    }
  },
  component: AppointmentsLayout,
});
