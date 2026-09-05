import { createFileRoute, redirect } from "@tanstack/react-router";

import { LoginPage } from "@/features/auth/components/login-page";
import { hasToken } from "@/features/auth/data/auth-store";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (hasToken()) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: LoginPage,
});