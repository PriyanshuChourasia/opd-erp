import { createFileRoute, redirect } from "@tanstack/react-router";
import { LandingPage } from "@/modules/auth/components/landing-page";
import { store } from "@/store";
import { getHomeRoute } from "@/lib/roles";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    const { user, accessToken } = store.getState().auth;
    if (accessToken && user) {
      throw redirect({ to: getHomeRoute(user.roleName) });
    }
  },
  component: LandingPage,
});
