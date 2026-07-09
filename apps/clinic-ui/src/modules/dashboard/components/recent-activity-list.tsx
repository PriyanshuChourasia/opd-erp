import { CalendarClock, ClipboardList, Receipt } from "lucide-react";
import type { RecentActivity } from "../data/interface";

const TYPE_ICON: Record<string, typeof CalendarClock> = {
  appointment: CalendarClock,
  billing: Receipt,
  prescription: ClipboardList,
};

function timeAgo(timestamp: string) {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function RecentActivityList({ activity }: { activity: RecentActivity[] }) {
  if (activity.length === 0) {
    return <p className="text-sm text-muted-foreground">No recent activity yet</p>;
  }

  return (
    <ul className="flex flex-col gap-4">
      {activity.map((item) => {
        const Icon = TYPE_ICON[item.type] ?? ClipboardList;
        return (
          <li key={item.id} className="flex items-start gap-3">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
              <Icon className="size-3.5 text-muted-foreground" />
            </span>
            <div className="flex-1">
              <p className="text-sm text-foreground/90">{item.description}</p>
              <p className="text-xs text-muted-foreground">{timeAgo(item.timestamp)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
