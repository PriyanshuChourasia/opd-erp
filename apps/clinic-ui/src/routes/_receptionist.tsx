import { createFileRoute, redirect } from "@tanstack/react-router";
import { ReceptionistLayout } from "@/layouts/receptionist-layout";
import { store } from "@/store";
import { getHomeRoute, isAdminRole } from "@/lib/roles";

export const Route = createFileRoute("/_receptionist")({
  beforeLoad: () => {
    const { status, user } = store.getState().auth;
    if (status !== "authenticated") {
      throw redirect({ to: "/login" });
    }
    if (isAdminRole(user?.roleName)) return;
    const home = getHomeRoute(user?.roleName);
    if (home !== "/receptionist") {
      throw redirect({ to: home });
    }
  },
  component: ReceptionistLayout,
});
