import { createFileRoute } from "@tanstack/react-router";
import { QueuePage } from "@/modules/queue";

export const Route = createFileRoute("/_dashboard/queue")({
  staticData: { title: "Queue" },
  component: QueuePage,
});
