import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/modules/settings/components/settings-page";

export const Route = createFileRoute("/_dashboard/settings")({
  component: SettingsPage,
});
