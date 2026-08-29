import { createFileRoute } from "@tanstack/react-router";
import { QueueDisplayPage } from "@/modules/queue-display/components/queue-display-page";

export const Route = createFileRoute("/display")({
  component: QueueDisplayPage,
});
