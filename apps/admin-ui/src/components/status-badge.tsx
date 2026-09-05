import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status?: string | null }) {
  return (
    <Badge variant={status === "active" ? "default" : "secondary"}>
      {status ?? "—"}
    </Badge>
  );
}