import { createFileRoute } from "@tanstack/react-router";
import { ProfilePage } from "@/modules/profile";

export const Route = createFileRoute("/_dashboard/profile")({
  staticData: { title: "Profile" },
  component: ProfilePage,
});
