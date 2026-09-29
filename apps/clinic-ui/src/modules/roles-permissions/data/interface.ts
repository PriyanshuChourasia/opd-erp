import type { Role, Permission } from "@/lib/api";

export type { Role, Permission };

export interface CreateRoleInput {
  name: string;
  description?: string;
  permissionIds?: string[];
}

export const resourceLabels: Record<string, string> = {
  // Core clinical
  patients: "Patients",
  appointments: "Appointments",
  doctors: "Doctors",
  prescriptions: "Prescriptions",
  "medicine-catalog": "Medicine Catalog",
  queue: "Queue",
  billing: "Billing",
  dispensing: "Dispensing",
  // Diagnostics & orders
  "lab-orders": "Lab Orders",
  "radiology-orders": "Radiology Orders",
  "procedure-orders": "Procedure Orders",
  diagnoses: "Diagnoses",
  "diagnosis-systems": "Diagnosis Systems",
  // Patient data
  allergies: "Allergies",
  "patient-allergy-records": "Patient Allergy Records",
  "patient-vitals": "Patient Vitals",
  addresses: "Addresses",
  // Organisation & HR
  organisation: "Organisation",
  "prescription-templates": "Prescription Templates",
  users: "Users",
  roles: "Roles",
  permissions: "Permissions",
  shifts: "Shifts",
  "employee-schedules": "Employee Schedules",
  // System
  documents: "Documents",
  settings: "Settings",
  dashboard: "Dashboard",
  reports: "Reports",
  developer: "Developer",
  health: "Health",
};

/** Resource categories for grouped display */
export const resourceCategories = [
  {
    label: "Core Clinical",
    resources: ["patients", "appointments", "doctors", "prescriptions", "medicine-catalog", "queue", "billing", "dispensing"],
  },
  {
    label: "Diagnostics & Orders",
    resources: ["lab-orders", "radiology-orders", "procedure-orders", "diagnoses", "diagnosis-systems"],
  },
  {
    label: "Patient Data",
    resources: ["allergies", "patient-allergy-records", "patient-vitals", "addresses"],
  },
  {
    label: "Organisation & HR",
    resources: ["organisation", "prescription-templates", "users", "roles", "permissions", "shifts", "employee-schedules"],
  },
  {
    label: "System",
    resources: ["documents", "settings", "dashboard", "reports", "developer", "health"],
  },
];

export const defaultResources = [
  // Core clinical
  "patients", "appointments", "doctors", "prescriptions",
  "medicine-catalog", "queue", "billing", "dispensing",
  // Diagnostics & orders
  "lab-orders", "radiology-orders", "procedure-orders", "diagnoses", "diagnosis-systems",
  // Patient data
  "allergies", "patient-allergy-records", "patient-vitals", "addresses",
  // Organisation & HR
  "organisation", "prescription-templates",
  "users", "roles", "permissions", "shifts", "employee-schedules",
  // System
  "documents", "settings", "dashboard", "reports", "developer", "health",
];

export const defaultActions = ["read", "create", "update", "delete", "manage"];

/** Role color mapping for badges */
export const roleColors: Record<string, string> = {
  "Developer": "bg-red-100 text-red-700 border-red-200",
  "Receptionist": "bg-accent text-accent-foreground border-border",
  "Doctor": "bg-secondary text-secondary-foreground border-border",
  "Nurse": "bg-pink-100 text-pink-700 border-pink-200",
  "Pharmacist": "bg-orange-100 text-orange-700 border-orange-200",
  "Lab Technician": "bg-accent text-primary border-border",
  "Assistant": "bg-secondary text-secondary-foreground border-border",
};
