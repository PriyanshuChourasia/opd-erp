import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useHelpForCurrentRoute } from "../data/use-help-route";
import { useAppSelector } from "@/store/hooks";
import { selectHelpModeEnabled } from "@/store/ui-preferences-slice";

/**
 * Link to the help simulator that automatically deep-links to the help file
 * for the currently active route (via the route -> help map). When no route
 * matches, it falls back to the simulator default (first module).
 * Returns null when Help Mode is disabled.
 */
export function HelpLink({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const helpModeEnabled = useAppSelector(selectHelpModeEnabled);
  const help = useHelpForCurrentRoute();
  if (!helpModeEnabled) return null;
  return (
    <Link
      to="/help"
      className={className}
      search={{ module: help?.module, page: help?.page }}
    >
      {children}
    </Link>
  );
}
