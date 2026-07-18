import { createFileRoute, redirect } from "@tanstack/react-router";
import { PosLayout } from "@/layouts/pos-layout";
import { store } from "@/store";
import { getHomeRoute, isAdminRole } from "@/lib/roles";

export const Route = createFileRoute("/_pos")({
  beforeLoad: () => {
    const { status, user } = store.getState().auth;
    if (status !== "authenticated") {
      throw redirect({ to: "/login" });
    }
    if (isAdminRole(user?.roleName)) return;
    const home = getHomeRoute(user?.roleName);
    if (home !== "/receptionist" && home !== "/dashboard") {
      throw redirect({ to: home });
    }
  },
  component: PosLayout,
});
