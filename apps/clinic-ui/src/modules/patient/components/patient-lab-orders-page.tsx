import { FlaskConical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function PatientLabOrdersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Lab Reports</h1>
        <p className="text-sm text-muted-foreground">Your lab test orders and results.</p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <FlaskConical className="size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Lab reports aren&apos;t available yet — check back soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
