import { createFileRoute } from "@tanstack/react-router";
import { UsersPage } from "@/modules/users";

export const Route = createFileRoute("/_dashboard/organisation/users")({
  staticData: { title: "Users" },
  component: UsersPage,
});
