import { createFileRoute } from "@tanstack/react-router";
import { UsersPage } from "@/modules/users/components/users-page";

export const Route = createFileRoute("/_dashboard/users")({
  component: UsersPage,
});
