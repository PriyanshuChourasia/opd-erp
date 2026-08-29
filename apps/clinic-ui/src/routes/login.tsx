import { createFileRoute, redirect } from "@tanstack/react-router";
import { LoginPage } from "@/modules/auth/components/login-page";
import { store } from "@/store";
import { getHomeRoute } from "@/lib/roles";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    const { user, accessToken } = store.getState().auth;
    if (accessToken && user) {
      throw redirect({ to: getHomeRoute(user.roleName) });
    }
  },
  component: LoginPage,
});
