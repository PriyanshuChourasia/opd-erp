export interface DashboardStats {
  todayAppointments: number;
  completedAppointments: number;
  pendingAppointments: number;
  patientsInQueue: number;
  registeredPatients: number;
  pendingPrescriptions: number;
  todayRevenue: number;
  outstandingAmount: number;
  lowStockMedicines: number;
  totalDoctors: number;
  activeDoctors: number;
  totalStaff: number;
  totalDepartments: number;
  totalActiveUsers: number;
  totalMedicines: number;
  opdCompleted: number;
  opdWaiting: number;
  opdTotal: number;
  latestAppointments: LatestAppointment[];
  latestQueue: LatestQueueEntry[];
  recentPatients: RecentPatient[];
  doctorAvailability: DoctorAvailability[];
}

export interface DashboardCharts {
  revenueTrend: { date: string; revenue: number }[];
  appointmentStatusBreakdown: { status: string; count: number }[];
  billStatusBreakdown: { status: string; count: number; amount: number }[];
  topMedicines: { medicine: string; quantity: number }[];
  recentActivity: ActivityItem[];
  weeklyAppointmentStats: { day: string; total: number; completed: number; cancelled: number; noShow: number }[];
  revenueByCategory: { category: string; amount: number; count: number }[];
  recentPatients: RecentPatient[];
}

export interface LatestAppointment {
  id: string;
  date: string;
  type: string;
  status: string;
  patient: { firstName: string; lastName: string; contactNo: string | null };
  doctor: { id: string; specialization: string | null; medicalRegistrationNo: string | null };
}

export interface LatestQueueEntry {
  id: string;
  tokenNumber: number | null;
  status: string;
  queueDate: string;
  createdAt: string;
  patient: { firstName: string; lastName: string; contactNo: string | null };
  doctor: { id: string; specialization: string | null; medicalRegistrationNo: string | null };
}

export interface RecentPatient {
  id: string;
  patientCode: string;
  firstName: string;
  lastName: string;
  gender: string | null;
  dateOfBirth: string | null;
  createdAt: string;
  bloodGroup?: string | null;
  contactNo?: string | null;
}

export interface DoctorAvailability {
  name: string;
  doctorId: string;
  appointmentCount: number;
  available: boolean;
}

export interface ActivityItem {
  id: string;
  type: 'appointment' | 'billing' | 'prescription';
  description: string;
  timestamp: string;
  actor: string;
}
