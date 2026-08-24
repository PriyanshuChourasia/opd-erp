import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarRange, Plus, Trash2, Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { extractApiError } from "@/lib/axios-client";
import {
  defaultFyEndDate,
  defaultFyStartDate,
  deriveFyLabel,
} from "@/lib/financial-year";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel } from "@/components/ui/field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  fetchFinancialYears,
  createFinancialYear,
  deleteFinancialYear,
  activateFinancialYear,
} from "@/lib/api";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function emptyForm() {
  return { startDate: defaultFyStartDate(), endDate: defaultFyEndDate() };
}

export function FinancialYearCard() {
  const queryClient = useQueryClient();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const previewLabel = form.startDate ? deriveFyLabel(form.startDate) : null;

  const { data: financialYears = [], isLoading } = useQuery({
    queryKey: ["financial-years"],
    queryFn: fetchFinancialYears,
  });

  const createMutation = useMutation({
    mutationFn: () => createFinancialYear(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-years"] });
      setSheetOpen(false);
      setForm(emptyForm());
      toast.success(`Financial year ${previewLabel ?? ""} created`.trim());
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => activateFinancialYear(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-years"] });
      toast.success("Financial year activated");
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFinancialYear(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-years"] });
      toast.success("Financial year deleted");
    },
    onError: (err) => toast.error(extractApiError(err)),
  });

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarRange className="size-4" />
              Financial Years
            </CardTitle>
            <CardDescription>Manage accounting periods for your clinic</CardDescription>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setSheetOpen(true)}>
            <Plus className="size-3.5" />
            Add FY
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : financialYears.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CalendarRange className="size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No financial years configured yet.</p>
              <Button size="sm" variant="outline" onClick={() => setSheetOpen(true)}>
                <Plus className="mr-1.5 size-3.5" />
                Create First FY
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {financialYears.map((fy) => (
                <div
                  key={fy.id}
                  className={cn(
                    "flex items-center justify-between rounded-none border px-3 py-2.5 transition-colors",
                    fy.isActive
                      ? "border-primary/30 bg-primary/5"
                      : "border-input hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        fy.isActive
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {fy.isActive ? <Check className="size-4" /> : <Clock className="size-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{fy.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(fy.startDate)} — {formatDate(fy.endDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {fy.isActive ? (
                      <span className="rounded-none border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        Active
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => activateMutation.mutate(fy.id)}
                        disabled={activateMutation.isPending}
                      >
                        Activate
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        if (confirm(`Delete financial year "${fy.label}"?`)) {
                          deleteMutation.mutate(fy.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>New Financial Year</SheetTitle>
            <SheetDescription>Create a new accounting period for your clinic.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-4 px-4">
            <Field>
              <FieldLabel htmlFor="fy-card-start">Start Date *</FieldLabel>
              <Input
                id="fy-card-start"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="fy-card-end">End Date *</FieldLabel>
              <Input
                id="fy-card-end"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
              {previewLabel && (
                <p className="text-xs text-muted-foreground">
                  Will be created as{" "}
                  <span className="font-medium text-foreground">{previewLabel}</span>
                </p>
              )}
            </Field>
          </div>
          <SheetFooter>
            <Button variant="outline" onClick={() => setSheetOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={
                !form.startDate || !form.endDate || form.startDate >= form.endDate || createMutation.isPending
              }
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
