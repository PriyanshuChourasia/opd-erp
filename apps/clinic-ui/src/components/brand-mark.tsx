import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "size-8",
  md: "size-9",
  lg: "size-11",
} as const;

interface BrandMarkProps {
  size?: keyof typeof sizeClasses;
  className?: string;
}

export function BrandMark({ size = "sm", className }: BrandMarkProps) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-border",
        sizeClasses[size],
        className,
      )}
    >
      <img src="/opdlogo.png" alt="OPD ERP" className="size-full object-contain p-1" />
    </span>
  );
}
