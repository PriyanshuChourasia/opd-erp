import { createFileRoute, redirect } from "@tanstack/react-router";
import { RegisterPage } from "@/modules/auth/components/register-page";
import { store } from "@/store";
import { getHomeRoute } from "@/lib/roles";

export const Route = createFileRoute("/register")({
  beforeLoad: () => {
    const { user, accessToken } = store.getState().auth;
    if (accessToken && user) {
      throw redirect({ to: getHomeRoute(user.roleName) });
    }
  },
  component: RegisterPage,
});
