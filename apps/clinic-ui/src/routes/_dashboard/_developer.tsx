import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { store } from "@/store";
import { getHomeRoute, isDeveloperRole } from "@/lib/roles";

export const Route = createFileRoute("/_dashboard/_developer")({
  beforeLoad: () => {
    const { status, user } = store.getState().auth;
    if (status !== "authenticated") throw redirect({ to: "/login" });
    if (!isDeveloperRole(user?.roleName)) {
      throw redirect({ to: getHomeRoute(user?.roleName) });
    }
  },
  component: () => <Outlet />,
});
