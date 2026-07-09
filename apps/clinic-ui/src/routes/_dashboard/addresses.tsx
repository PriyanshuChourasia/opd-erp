import { createFileRoute } from "@tanstack/react-router";
import { AddressesPage } from "@/modules/addresses";

export const Route = createFileRoute("/_dashboard/addresses")({
  staticData: { title: "Addresses" },
  component: AddressesPage,
});
