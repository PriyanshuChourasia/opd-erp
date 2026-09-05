import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export function EntityFormPage({
  backTo,
  backLabel,
  title,
  description,
  formId,
  submitLabel,
  isPending,
  cancelTo,
  children,
}: {
  backTo: string;
  backLabel: string;
  title: string;
  description: string;
  formId: string;
  submitLabel: string;
  isPending: boolean;
  cancelTo: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" asChild>
          <Link to={backTo as never}>
            <ArrowLeft /> {backLabel}
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Card>
        <CardContent className="p-6">{children}</CardContent>
        <CardFooter className="justify-end gap-3 border-t px-6 py-4">
          <Button type="button" variant="outline" asChild disabled={isPending}>
            <Link to={cancelTo as never}>Cancel</Link>
          </Button>
          <Button type="submit" form={formId} disabled={isPending}>
            {submitLabel}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}