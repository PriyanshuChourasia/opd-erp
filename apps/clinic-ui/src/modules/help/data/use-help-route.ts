import { useMatchRoute } from "@tanstack/react-router";
import {
  ROUTE_HELP_MAP,
  type AppRoutePath,
  type HelpRouteMapEntry,
} from "./route-map";

/**
 * Resolves the currently active route to the help file that documents it.
 * Uses the router's own matcher so dynamic segments (e.g. `$appointmentId`)
 * are handled correctly. Returns undefined when no route is matched (the
 * caller can then fall back to the module overview / first module).
 */
export function useHelpForCurrentRoute(): HelpRouteMapEntry | undefined {
  const matchRoute = useMatchRoute();
  for (const route of Object.keys(ROUTE_HELP_MAP) as AppRoutePath[]) {
    if (matchRoute({ to: route, fuzzy: false })) {
      return ROUTE_HELP_MAP[route];
    }
  }
  return undefined;
}
