export interface DashboardStats {
  todayAppointments: number;
  patientsInQueue: number;
  registeredPatients: number;
  pendingPrescriptions: number;
  todayRevenue: number;
  latestAppointments: LatestAppointment[];
  latestQueue: LatestQueueEntry[];
}

export interface LatestAppointment {
  id: string;
  date: string;
  type: string;
  status: string;
  patient: { firstName: string; lastName: string; contactNo: string | null };
  doctor: { id: string; specialization: string | null };
}

export interface LatestQueueEntry {
  id: string;
  tokenNumber: number | null;
  status: string;
  queueDate: string;
  createdAt: string;
  patient: { firstName: string; lastName: string; contactNo: string | null };
  doctor: { id: string; specialization: string | null };
}
