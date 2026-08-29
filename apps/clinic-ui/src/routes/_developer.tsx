import { createFileRoute, redirect } from "@tanstack/react-router";
import { DeveloperLayout } from "@/layouts/developer-layout";
import { store } from "@/store";
import { getHomeRoute, isDeveloperRole } from "@/lib/roles";

export const Route = createFileRoute("/_developer")({
  beforeLoad: () => {
    const { status, user } = store.getState().auth;
    if (status !== "authenticated") {
      throw redirect({ to: "/login" });
    }
    if (!isDeveloperRole(user?.roleName)) {
      throw redirect({ to: getHomeRoute(user?.roleName) });
    }
  },
  component: DeveloperLayout,
});
