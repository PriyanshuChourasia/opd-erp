/** The Prescriptions list lives at a different URL prefix per role layout
 *  (_dashboard/_doctor/_receptionist each mount their own copy of
 *  PrescriptionsPage) — these mirror lib/roles.ts's getHomeRoute pattern so
 *  navigation from either page stays inside the current layout. */
export function prescriptionsListRoute(pathname: string): "/prescriptions" | "/doctor/prescriptions" | "/receptionist/prescriptions" {
  if (pathname.startsWith("/doctor")) return "/doctor/prescriptions";
  if (pathname.startsWith("/receptionist")) return "/receptionist/prescriptions";
  return "/prescriptions";
}

export function newPrescriptionRoute(pathname: string): "/prescriptions/new" | "/doctor/prescriptions/new" | "/receptionist/prescriptions/new" {
  if (pathname.startsWith("/doctor")) return "/doctor/prescriptions/new";
  if (pathname.startsWith("/receptionist")) return "/receptionist/prescriptions/new";
  return "/prescriptions/new";
}

/** Edit Prescription page — same per-role-layout URL prefix as the list/new
 *  routes. Returns the literal route id string (dynamic segment, NOT
 *  interpolated); the caller passes params: { prescriptionId } separately, e.g.
 *  navigate({ to: editPrescriptionRoute(pathname, rx.id), params: { prescriptionId: rx.id } }). */
export function editPrescriptionRoute(pathname: string, prescriptionId: string): "/prescriptions/$prescriptionId/edit" | "/doctor/prescriptions/$prescriptionId/edit" | "/receptionist/prescriptions/$prescriptionId/edit" {
  void prescriptionId;
  if (pathname.startsWith("/doctor")) return "/doctor/prescriptions/$prescriptionId/edit";
  if (pathname.startsWith("/receptionist")) return "/receptionist/prescriptions/$prescriptionId/edit";
  return "/prescriptions/$prescriptionId/edit";
}
