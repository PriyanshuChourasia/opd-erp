import { createFileRoute, redirect } from "@tanstack/react-router";
import { ReceptionistLayout } from "@/layouts/receptionist-layout";
import { store } from "@/store";

export const Route = createFileRoute("/_receptionist")({
  beforeLoad: () => {
    const { status } = store.getState().auth;
    if (status !== "authenticated") {
      throw redirect({ to: "/login" });
    }
  },
  component: ReceptionistLayout,
});
