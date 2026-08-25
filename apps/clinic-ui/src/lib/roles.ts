/** Roles that work the front desk land on the receptionist POS instead of the stats dashboard. */
const DESK_ROLES = new Set(["RECEPTIONIST"]);
const DOCTOR_ROLES = new Set(["DOCTOR"]);
const ADMIN_ROLES = new Set(["ADMIN", "SUPER ADMIN", "DEVELOPER"]);

/** Admin roles can navigate to any layout without being redirected. */
export function isAdminRole(roleName: string | undefined): boolean {
  const role = roleName?.toUpperCase();
  return !!role && ADMIN_ROLES.has(role);
}

/** Only the Developer role gets Developer tools — Admin is deliberately excluded. */
export function isDeveloperRole(roleName: string | undefined): boolean {
  return roleName?.toUpperCase() === "DEVELOPER";
}

export function getHomeRoute(
  roleName: string | undefined,
): "/receptionist" | "/doctor" | "/dashboard" {
  const role = roleName?.toUpperCase();
  if (role && DOCTOR_ROLES.has(role)) return "/doctor";
  if (role && DESK_ROLES.has(role)) return "/receptionist";
  return "/dashboard";
}

/**
 * Checks for an exact `action:resource` permission string, matching the format
 * the backend's JwtStrategy encodes into `user.permissions` and the exact
 * string PermissionsGuard checks on the server — so a button gated by this
 * only ever shows when the underlying API call would actually succeed.
 */
export function hasPermission(
  permissions: string[] | undefined,
  action: string,
  resource: string,
): boolean {
  return !!permissions?.includes(`${action}:${resource}`);
}

/**
 * Finds the most specific sidebar-config module path that owns `pathname`
 * (exact match, or `pathname` nested under it), e.g. `/organisation/roles`
 * is owned by `/organisation/roles` if that's a registered module, otherwise
 * falls back to `/organisation` if that's registered instead.
 * Returns undefined when `pathname` isn't part of any known module — those
 * routes (e.g. detail pages, always-on utility pages) aren't gated.
 */
export function findGatedModulePath(
  pathname: string,
  allPaths: string[],
): string | undefined {
  return allPaths
    .filter((path) => pathname === path || pathname.startsWith(`${path}/`))
    .sort((a, b) => b.length - a.length)[0];
}
