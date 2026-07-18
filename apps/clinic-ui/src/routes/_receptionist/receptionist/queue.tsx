import { createFileRoute } from "@tanstack/react-router";
import { QueuePage } from "@/modules/queue";

export const Route = createFileRoute("/_receptionist/receptionist/queue")({
  component: QueuePage,
});
