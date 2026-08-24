/** Roles that work the front desk land on the receptionist POS instead of the stats dashboard. */
const DESK_ROLES = new Set(["RECEPTIONIST"]);
const DOCTOR_ROLES = new Set(["DOCTOR"]);
const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);
const DEVELOPER_ROLES = new Set(["DEVELOPER"]);

/** Admin roles can navigate to any layout without being redirected. */
export function isAdminRole(roleName: string | undefined): boolean {
  const role = roleName?.toUpperCase();
  return !!role && ADMIN_ROLES.has(role);
}

export function isSuperAdmin(roleName: string | undefined): boolean {
  return roleName === 'Super Admin';
}

export function getHomeRoute(
  roleName: string | undefined,
): "/receptionist" | "/doctor" | "/developer" | "/dashboard" {
  const role = roleName?.toUpperCase();
  if (role && DOCTOR_ROLES.has(role)) return "/doctor";
  if (role && DESK_ROLES.has(role)) return "/receptionist";
  if (role && DEVELOPER_ROLES.has(role)) return "/developer";
  return "/dashboard";
}
