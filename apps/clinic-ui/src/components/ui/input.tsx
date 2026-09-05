import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, value, ...props }: React.ComponentProps<"input">) {
  // Empty fields render a faint border; once a value is present the border
  // becomes the normal full-strength one, so a long form shows at a glance
  // which fields have been filled in. Border stays solid throughout — only
  // the color/opacity changes.
  const hasValue = value !== undefined && value !== null && value !== "";
  return (
    <input
      type={type}
      value={value}
      data-slot="input"
      data-has-value={hasValue}
      className={cn(
        "h-10 w-full min-w-0 rounded-none border border-input/40 bg-transparent px-3 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground data-[has-value=true]:border-input focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
