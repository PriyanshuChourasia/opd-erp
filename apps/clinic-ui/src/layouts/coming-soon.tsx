import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ComingSoonProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function ComingSoon({ icon: Icon, title, description }: ComingSoonProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-muted">
          <Icon className="size-6 text-muted-foreground" />
        </span>
        <div>
          <h2 className="text-lg font-medium">{title}</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
