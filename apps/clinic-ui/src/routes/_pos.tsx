import { createFileRoute, redirect } from "@tanstack/react-router";
import { PosLayout } from "@/layouts/pos-layout";
import { store } from "@/store";

export const Route = createFileRoute("/_pos")({
  beforeLoad: () => {
    const { status } = store.getState().auth;
    if (status !== "authenticated") {
      throw redirect({ to: "/login" });
    }
  },
  component: PosLayout,
});
