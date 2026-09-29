import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";
import { useInView } from "@/modules/auth/hooks/use-in-view";

type RevealProps = {
  children: ReactNode;
  /** Transition delay in ms — used to stagger siblings. */
  delay?: number;
  /** Rendered element/tag. Defaults to div. */
  as?: ElementType;
  className?: string;
};

/**
 * Scroll-triggered reveal: children start translated down and transparent,
 * then ease into place over 700ms once the element enters the viewport.
 * Animates once (the hook latches); with reduced motion the hook reports
 * in-view immediately so content is visible with no transition at all.
 */
export function Reveal({
  children,
  delay = 0,
  as: Tag = "div",
  className,
}: RevealProps) {
  const [ref, inView] = useInView<HTMLDivElement>();

  return (
    <Tag
      ref={ref}
      className={cn(
        "transition-[opacity,translate] duration-700 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none",
        inView ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
        className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
