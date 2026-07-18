/** Roles that work the front desk land on the receptionist POS instead of the stats dashboard. */
const DESK_ROLES = new Set(["RECEPTIONIST"]);
const DOCTOR_ROLES = new Set(["DOCTOR"]);
const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);

/** Admin roles can navigate to any layout without being redirected. */
export function isAdminRole(roleName: string | undefined): boolean {
  const role = roleName?.toUpperCase();
  return !!role && ADMIN_ROLES.has(role);
}

export function getHomeRoute(roleName: string | undefined): "/receptionist" | "/doctor" | "/dashboard" {
  const role = roleName?.toUpperCase();
  if (role && DOCTOR_ROLES.has(role)) return "/doctor";
  if (role && DESK_ROLES.has(role)) return "/receptionist";
  return "/dashboard";
}
