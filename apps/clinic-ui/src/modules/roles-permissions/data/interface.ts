import type { Role, Permission } from "@/lib/api";

export type { Role, Permission };

export interface CreateRoleInput {
  name: string;
  description?: string;
  permissionIds?: string[];
}

export const resourceLabels: Record<string, string> = {
  patients: "Patients",
  appointments: "Appointments",
  doctors: "Doctors",
  prescriptions: "Prescriptions",
  "medicine-catalog": "Medicine Catalog",
  queue: "Queue",
  billing: "Billing",
  dispensing: "Dispensing",
  users: "Users",
  roles: "Roles",
  settings: "Settings",
};

export const defaultResources = [
  "patients", "appointments", "doctors", "prescriptions",
  "medicine-catalog", "queue", "billing", "dispensing",
  "users", "roles", "settings",
];

export const defaultActions = ["read", "create", "update", "delete", "manage"];
