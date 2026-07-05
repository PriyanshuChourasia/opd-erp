/** Roles that work the front desk land straight on the POS screen instead of the stats dashboard. */
const DESK_ROLES = new Set(["RECEPTIONIST"]);

export function getHomeRoute(roleName: string | undefined): "/pos" | "/dashboard" {
  return roleName && DESK_ROLES.has(roleName.toUpperCase()) ? "/pos" : "/dashboard";
}
