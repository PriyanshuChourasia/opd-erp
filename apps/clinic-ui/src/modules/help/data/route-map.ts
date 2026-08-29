import type { FileRoutesByTo } from "@/routeTree.gen";

/**
 * Maps every app route to the help file that documents it:
 *   - `module` is the module slug (directory name) that has a `help.md`
 *   - `page` is the per-page help id (file name without `.help.md`) when the
 *     route is documented by a `*.help.md` file; omitted when the module's
 *     `help.md` covers the whole page.
 *
 * Keys are the route paths from the generated route tree, so TypeScript
 * verifies every key is a real route and the map stays in sync with the app.
 */
export interface HelpRouteMapEntry {
  /** Module slug — must have a matching entry in loadHelpContent(). */
  module: string;
  /** Per-page help id when the route maps to a `*.help.md` file. */
  page?: string;
}

export type AppRoutePath = keyof FileRoutesByTo;

export const ROUTE_HELP_MAP: Record<AppRoutePath, HelpRouteMapEntry> = {
  // Auth / landing
  "/": { module: "auth" },
  "/login": { module: "auth" },

  // Public display
  "/display": { module: "queue-display" },

  // The help simulator itself
  "/help": { module: "help" },

  // Dashboard workspace
  "/dashboard": { module: "dashboard" },
  "/addresses": { module: "addresses" },
  "/allergies": { module: "allergies" },
  "/billing": { module: "billing" },
  "/diagnoses": { module: "diagnoses" },
  "/dispensing": { module: "dispensing" },
  "/doctors": { module: "doctors" },
  "/medicine-catalog": { module: "medicine-catalog" },
  "/organisation": { module: "organisation" },
  "/organisation/prescription-templates": { module: "prescription-templates" },
  "/organisation/roles": { module: "roles-permissions" },
  "/organisation/sidebar-config": { module: "sidebar-config" },
  "/organisation/departments": { module: "departments" },
  "/organisation/designations": { module: "designations" },
  "/organisation/financial-years": { module: "financial-years" },
  "/organisation/users": { module: "users" },
  "/patients": { module: "patients" },
  "/prescriptions": { module: "prescriptions" },
  "/profile": { module: "profile" },
  "/shifts": { module: "shifts" },

  // Reports
  "/reports/doctor-performance": { module: "reports", page: "doctor-performance-page" },
  "/reports/outstanding-bills": { module: "reports", page: "outstanding-bills-page" },
  "/reports/revenue-by-category": { module: "reports", page: "revenue-by-category-page" },
  "/reports/top-medicines": { module: "reports", page: "top-medicines-page" },

  // Appointments workspace
  "/appointments": { module: "appointments", page: "appointments-page" },
  "/appointments/new": { module: "appointments", page: "new-appointment-page" },
  "/appointments/$appointmentId/edit": { module: "appointments", page: "edit-appointment-page" },
  "/queue": { module: "queue" },

  // Receptionist workspace
  "/receptionist": { module: "receptionist" },
  "/receptionist/appointments": { module: "appointments", page: "appointments-page" },
  "/receptionist/appointments/new": { module: "appointments", page: "new-appointment-page" },
  "/receptionist/billing": { module: "billing" },
  "/receptionist/doctors": { module: "doctors" },
  "/receptionist/patients": { module: "patients" },
  "/receptionist/prescriptions": { module: "prescriptions" },
  "/receptionist/profile": { module: "profile" },

  // POS workspace
  "/pos": { module: "pos", page: "pos-checkout-page" },
  "/pos/patients": { module: "pos", page: "pos-patients-page" },
  "/pos/billing": { module: "pos", page: "pos-billing-page" },
  "/pos/appointments": { module: "pos", page: "pos-appointments-page" },

  // Doctor workspace
  "/doctor": { module: "doctor" },
  "/doctor/prescriptions": { module: "prescriptions" },
  "/doctor/profile": { module: "profile" },
  "/doctor/admin": { module: "doctor-admin" },
  "/doctor/admin/appointments": { module: "doctor-admin", page: "admin-appointments" },
  "/doctor/admin/prescriptions": { module: "doctor-admin", page: "admin-prescriptions" },

  // Patient portal
  "/patient": { module: "patient", page: "patient-dashboard-page" },
  "/patient/appointments": { module: "patient", page: "patient-appointments-page" },
  "/patient/bills": { module: "patient", page: "patient-bills-page" },
  "/patient/prescriptions": { module: "patient", page: "patient-prescriptions-page" },
  "/patient/lab-orders": { module: "patient", page: "patient-lab-orders-page" },



  // Developer workspace
  "/developer": { module: "development-overview" },
  "/developer/modules": { module: "development-modules" },
  "/developer/features": { module: "development-features" },
  "/developer/apis": { module: "development-apis" },
  "/developer/schema": { module: "development-schema" },
  "/developer/schema/$model": { module: "development-schema" },
};
