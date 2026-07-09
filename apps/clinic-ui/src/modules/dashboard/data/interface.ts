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

export interface RevenuePoint {
  date: string;
  revenue: number;
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface DoctorLoad {
  doctor: string;
  count: number;
}

export interface BillStatusBreakdown {
  status: string;
  count: number;
  amount: number;
}

export interface MedicineUsage {
  medicine: string;
  quantity: number;
}

export interface DashboardCharts {
  revenueTrend: RevenuePoint[];
  appointmentStatusBreakdown: StatusCount[];
  doctorLoad: DoctorLoad[];
  billStatusBreakdown: BillStatusBreakdown[];
  topMedicines: MedicineUsage[];
  recentActivity: RecentActivity[];
}
