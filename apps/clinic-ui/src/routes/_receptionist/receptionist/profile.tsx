import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/modules/profile";

export const Route = createFileRoute("/_receptionist/receptionist/profile")({
  component: ProfilePage,
});
