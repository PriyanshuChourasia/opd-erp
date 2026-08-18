import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useHelpForCurrentRoute } from "../data/use-help-route";

/**
 * Link to the help simulator that automatically deep-links to the help file
 * for the currently active route (via the route -> help map). When no route
 * matches, it falls back to the simulator default (first module).
 */
export function HelpLink({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const help = useHelpForCurrentRoute();
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
