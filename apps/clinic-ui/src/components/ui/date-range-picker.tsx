import { useState } from "react";
import { format, parse, subDays, addDays, startOfMonth } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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

function tomorrowStr(): string {
  return from_date(addDays(new Date(), 1));
}

function monthStartStr(): string {
  return from_date(startOfMonth(new Date()));
}

const PRESETS = [
  { label: "Today", from: todayStr(), to: todayStr() },
  { label: "Tomorrow", from: tomorrowStr(), to: tomorrowStr() },
  { label: "Last 7 days", from: daysAgoStr(6), to: todayStr() },
  { label: "Last 30 days", from: daysAgoStr(29), to: todayStr() },
  { label: "This month", from: monthStartStr(), to: todayStr() },
] as const;

/**
 * Plain date-range filter — Today/Tomorrow/Last-N-days presets plus a manual
 * calendar range. Financial Year selection is a separate control (see
 * `FinancialYearSelect` in the dashboard header) since it's backed by the
 * organisation's actually-configured financial years, not a generic
 * calendar-year guess, and shouldn't be conflated with an ad-hoc date range.
 */
export function DateRangePicker({ value, onChange, className, placeholder = "Pick a date range" }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const from = to_date(value?.from);
  const to = to_date(value?.to);

  const hasRange = !!from && !!to;

  function formatLabel() {
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
