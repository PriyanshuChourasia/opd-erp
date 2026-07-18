import { createFileRoute, redirect } from "@tanstack/react-router";
import { DeveloperLayout } from "@/layouts/developer-layout";
import { store } from "@/store";

export const Route = createFileRoute("/_developer")({
  beforeLoad: () => {
    const { status } = store.getState().auth;
    if (status !== "authenticated") {
      throw redirect({ to: "/login" });
    }
  },
  component: DeveloperLayout,
});
