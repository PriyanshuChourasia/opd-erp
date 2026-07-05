import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/modules/auth/components/landing-page";

export const Route = createFileRoute("/")({
  component: LandingPage,
});
