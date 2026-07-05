export interface DashboardStats {
  todayAppointments: number;
  patientsInQueue: number;
  registeredPatients: number;
  pendingPrescriptions: number;
}

export interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}
