import * as React from "react"
import { Eye, EyeOff } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

/**
 * Password field with a built-in show/hide toggle.
 *
 * Wraps <Input>, forcing `type` internally, so call sites keep using the
 * normal input API ({...form.register(...)}, value/onChange, id, etc.) and
 * never manage their own visibility state.
 */
function PasswordInput({ className, disabled, ...props }: React.ComponentProps<"input">) {
  const [visible, setVisible] = React.useState(false)
  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        data-slot="password-input"
        className={cn("pr-9", className)}
        disabled={disabled}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        title={visible ? "Hide password" : "Show password"}
        disabled={disabled}
        onClick={() => setVisible((v) => !v)}
        onMouseDown={(e) => e.preventDefault()}
        className="absolute top-1/2 right-1 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-none text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:text-foreground disabled:pointer-events-none disabled:opacity-50"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}

export { PasswordInput }
