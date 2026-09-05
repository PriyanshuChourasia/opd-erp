import { createFileRoute } from "@tanstack/react-router";
import { QueuePage } from "@/modules/queue";
import { dateRangeSearchValidator } from "@/lib/date-range-search";

export const Route = createFileRoute("/_dashboard/queue")({
  staticData: { title: "Queue" },
  validateSearch: dateRangeSearchValidator,
  component: QueuePage,
});
