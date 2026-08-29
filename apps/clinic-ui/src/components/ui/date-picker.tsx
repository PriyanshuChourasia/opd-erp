import { useState } from "react";
import { format, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerProps {
  value?: string;
  onChange?: (date: string) => void;
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

export function DatePicker({ value, onChange, className, placeholder = "Pick a date" }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = to_date(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-auto justify-start gap-2 text-left font-normal",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="size-4 shrink-0" />
          {selected ? format(selected, DISPLAY_FORMAT) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={4}>
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(day) => {
            if (day) {
              onChange?.(from_date(day));
              setOpen(false);
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
