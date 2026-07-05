import { createFileRoute, redirect } from "@tanstack/react-router";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { store } from "@/store";

export const Route = createFileRoute("/_dashboard")({
  beforeLoad: () => {
    const { status } = store.getState().auth;
    if (status !== "authenticated") {
      throw redirect({ to: "/login" });
    }
  },
  component: DashboardLayout,
});
