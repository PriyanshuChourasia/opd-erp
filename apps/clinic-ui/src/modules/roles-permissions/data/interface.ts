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
  "Admin": "bg-gray-900 text-white border-gray-800",
  "Super Admin": "bg-gray-900 text-white border-gray-800",
  "Developer": "bg-red-100 text-red-700 border-red-200",
  "Receptionist": "bg-blue-100 text-blue-700 border-blue-200",
  "Doctor": "bg-green-100 text-green-700 border-green-200",
  "Doctor as Admin": "bg-green-100 text-green-700 border-green-200",
  "Nurse": "bg-pink-100 text-pink-700 border-pink-200",
  "Pharmacist": "bg-orange-100 text-orange-700 border-orange-200",
  "Lab Technician": "bg-purple-100 text-purple-700 border-purple-200",
  "Assistant": "bg-teal-100 text-teal-700 border-teal-200",
};
