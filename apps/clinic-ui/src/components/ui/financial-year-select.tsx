import { useState } from "react";
import { CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { FinancialYear } from "@/lib/api";

interface FinancialYearSelectProps {
  years: FinancialYear[];
  value?: { from?: string; to?: string };
  onChange?: (range: { from: string; to: string }) => void;
  className?: string;
}

/**
 * Independent Financial Year filter, backed by the organisation's actually
 * configured financial years (Settings → Financial Years) rather than a
 * generic calendar-year guess. Kept separate from DateRangePicker so picking
 * one doesn't clobber the other's state — both just happen to write into the
 * same underlying date-range filter.
 */
export function FinancialYearSelect({ years, value, onChange, className }: FinancialYearSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = years.find((fy) => fy.startDate.slice(0, 10) === value?.from && fy.endDate.slice(0, 10) === value?.to);

  if (years.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn("w-auto justify-start gap-2 text-left font-normal", !selected && "text-muted-foreground", className)}
        >
          <CalendarClock className="size-4 shrink-0" />
          {selected ? `FY: ${selected.name}` : "Financial Year"}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={4} className="w-56 p-1">
        {years.map((fy) => (
          <button
            key={fy.id}
            type="button"
            className={cn(
              "flex w-full items-center justify-between rounded-md px-3 py-1.5 text-xs transition-colors hover:bg-muted",
              selected?.id === fy.id && "bg-primary/10 text-primary font-medium",
            )}
            onClick={() => {
              onChange?.({ from: fy.startDate.slice(0, 10), to: fy.endDate.slice(0, 10) });
              setOpen(false);
            }}
          >
            <span>{fy.name}</span>
            {fy.isCurrent && <span className="text-[10px] text-muted-foreground">Current</span>}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
