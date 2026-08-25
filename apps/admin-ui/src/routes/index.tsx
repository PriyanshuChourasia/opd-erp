import { createFileRoute } from "@tanstack/react-router";
import { LoginPage } from "@/modules/auth/components/login-page";

export const Route = createFileRoute("/")({
  component: LoginPage,
});
