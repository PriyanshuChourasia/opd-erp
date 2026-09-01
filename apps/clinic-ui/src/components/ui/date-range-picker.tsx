import { useState } from "react";
import { format, parse, subDays, startOfMonth } from "date-fns";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getFinancialYearOptions, type FinancialYearRange } from "@/lib/financial-year";

interface DateRange {
  from?: string;
  to?: string;
}

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange) => void;
  className?: string;
  placeholder?: string;
}

const DATE_FORMAT = "yyyy-MM-dd";
const DISPLAY_FORMAT = "MMM d, yyyy";

function to_date(value?: string): Date | undefined {
  if (!value) return undefined;
  try {
    return parse(value, DATE_FORMAT, new Date());
  } catch {
    return undefined;
  }
}

function from_date(date: Date): string {
  return format(date, DATE_FORMAT);
}

function todayStr(): string {
  return from_date(new Date());
}

function daysAgoStr(n: number): string {
  return from_date(subDays(new Date(), n));
}

function monthStartStr(): string {
  return from_date(startOfMonth(new Date()));
}

const PRESETS = [
  { label: "Today", from: todayStr(), to: todayStr() },
  { label: "Last 7 days", from: daysAgoStr(6), to: todayStr() },
  { label: "Last 30 days", from: daysAgoStr(29), to: todayStr() },
  { label: "This month", from: monthStartStr(), to: todayStr() },
] as const;

const FY_OPTIONS = getFinancialYearOptions(5);

/**
 * Check if the current value matches a Financial Year range exactly.
 * Returns the FY label if matched, otherwise undefined.
 */
function matchFY(from?: string, to?: string): string | undefined {
  if (!from || !to) return undefined;
  const match = FY_OPTIONS.find((fy) => fy.from === from && fy.to === to);
  return match?.label;
}

export function DateRangePicker({ value, onChange, className, placeholder = "Pick a date range" }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [fyOpen, setFyOpen] = useState(false);
  const from = to_date(value?.from);
  const to = to_date(value?.to);

  const hasRange = !!from && !!to;
  const fyLabel = matchFY(value?.from, value?.to);

  function formatLabel() {
    if (fyLabel) return fyLabel;
    if (!from || !to) return placeholder;
    return `${format(from, DISPLAY_FORMAT)} – ${format(to, DISPLAY_FORMAT)}`;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-auto justify-start gap-2 text-left font-normal",
            !hasRange && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="size-4 shrink-0" />
          {formatLabel()}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={4} className="w-auto p-0">
        {/* Financial Year selector */}
        <div className="border-b p-2">
          <div className="relative">
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
              onClick={() => setFyOpen((v) => !v)}
            >
              <span>Financial Year</span>
              <ChevronDown className={cn("size-3.5 text-muted-foreground transition-transform", fyOpen && "rotate-180")} />
            </button>
            {fyOpen && (
              <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                {FY_OPTIONS.map((fy) => (
                  <button
                    key={fy.label}
                    type="button"
                    className={cn(
                      "flex w-full items-center justify-between px-3 py-1.5 text-xs transition-colors hover:bg-muted",
                      fyLabel === fy.label && "bg-primary/10 text-primary font-medium",
                    )}
                    onClick={() => {
                      onChange?.({ from: fy.from, to: fy.to });
                      setFyOpen(false);
                      setOpen(false);
                    }}
                  >
                    <span>{fy.label}</span>
                    <span className="text-muted-foreground">{fy.from.slice(0, 4)}–{String(Number(fy.to.slice(0, 4))).slice(-2)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Preset shortcuts */}
        <div className="flex gap-1 border-b p-2">
          {PRESETS.map((preset) => (
            <Button
              key={preset.label}
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                onChange?.({ from: preset.from, to: preset.to });
                setOpen(false);
              }}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        {/* Range calendar */}
        <Calendar
          mode="range"
          numberOfMonths={2}
          selected={from && to ? { from, to } : undefined}
          onSelect={(range) => {
            if (range?.from && range?.to) {
              onChange?.({ from: from_date(range.from), to: from_date(range.to) });
            }
          }}
        />

        {/* Clear button */}
        {hasRange && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground"
              onClick={() => {
                onChange?.({ from: undefined, to: undefined });
                setOpen(false);
              }}
            >
              Clear filter
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
