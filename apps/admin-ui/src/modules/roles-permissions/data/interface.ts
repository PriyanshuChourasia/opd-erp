import type { Role, Permission } from "@/lib/api";

export type { Role, Permission };

export const resourceLabels: Record<string, string> = {
  users: "Users",
  roles: "Roles",
  permissions: "Permissions",
  organisations: "Organisations",
  modules: "Modules",
  settings: "Settings",
  dashboard: "Dashboard",
  reports: "Reports",
};

export const resourceCategories = [
  {
    label: "Access Control",
    resources: ["users", "roles", "permissions"],
  },
  {
    label: "Organisation",
    resources: ["organisations"],
  },
  {
    label: "System",
    resources: ["modules", "settings", "dashboard", "reports"],
  },
];

export const defaultResources = [
  "users",
  "roles",
  "permissions",
  "organisations",
  "modules",
  "settings",
  "dashboard",
  "reports",
];

export const defaultActions = ["read", "create", "update", "delete", "manage"];

/** Role color mapping for badges */
export const roleColors: Record<string, string> = {
  Admin: "bg-red-100 text-red-700 border-red-200",
  Manager: "bg-blue-100 text-blue-700 border-blue-200",
  Editor: "bg-green-100 text-green-700 border-green-200",
  Viewer: "bg-gray-100 text-gray-700 border-gray-200",
};
