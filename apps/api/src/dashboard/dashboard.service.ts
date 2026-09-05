import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);

    const [
      todayAppointments,
      completedAppointments,
      patientsInQueue,
      registeredPatients,
      pendingPrescriptions,
      todayBills,
      outstandingBills,
      lowStockMedicines,
      totalDoctors,
      doctorsWithApptsToday,
      totalStaff,
      totalDepartments,
      totalActiveUsers,
      totalMedicines,
      latestAppointments,
      latestQueue,
      recentPatients,
      opdCompleted,
      opdWaiting,
    ] = await Promise.all([
      this.prisma.appointment.count({
        where: { date: { gte: today, lt: tomorrow } },
      }),
      this.prisma.appointment.count({
        where: { date: { gte: today, lt: tomorrow }, status: 'COMPLETED' },
      }),
      this.prisma.queueEntry.count({
        where: {
          queueDate: { gte: today, lt: tomorrow },
          status: { in: ['WAITING', 'IN_PROGRESS'] },
        },
      }),
      this.prisma.patient.count(),
      this.prisma.prescription.count({ where: { status: 'ACTIVE' } }),
      this.prisma.bill.findMany({
        where: {
          createdAt: { gte: today, lt: tomorrow },
          status: { notIn: ['CANCELLED', 'REFUNDED'] },
        },
        select: { total: true },
      }),
      this.prisma.bill.findMany({
        where: { status: { in: ['PENDING', 'PARTIAL'] } },
        select: { total: true },
      }),
      this.prisma.medicine.count({
        where: {
          isActive: true,
          currentStock: { not: null, lt: 10 },
        },
      }),
      this.prisma.doctor.count({ where: { isActive: true } }),
      this.prisma.appointment
        .groupBy({
          by: ['doctorId'],
          where: { date: { gte: today, lt: tomorrow } },
        })
        .then((rows) => rows.length),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.department.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.medicine.count({ where: { isActive: true } }),
      this.prisma.appointment.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          date: true,
          type: true,
          status: true,
          patient: {
            select: { firstName: true, lastName: true, contactNo: true },
          },
          doctor: {
            select: {
              id: true,
              specialization: true,
              medicalRegistrationNo: true,
            },
          },
        },
      }),
      this.prisma.queueEntry.findMany({
        take: 10,
        where: { queueDate: { gte: today, lt: tomorrow } },
        orderBy: [{ createdAt: 'asc' }],
        select: {
          id: true,
          tokenNumber: true,
          status: true,
          queueDate: true,
          createdAt: true,
          patient: {
            select: { firstName: true, lastName: true, contactNo: true },
          },
          doctor: {
            select: {
              id: true,
              specialization: true,
              medicalRegistrationNo: true,
            },
          },
        },
      }),
      this.prisma.patient.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          patientCode: true,
          firstName: true,
          lastName: true,
          gender: true,
          dateOfBirth: true,
          createdAt: true,
          bloodGroup: true,
        },
      }),
      this.prisma.appointment.count({
        where: {
          date: { gte: today, lt: tomorrow },
          status: 'COMPLETED',
          type: 'CONSULTATION',
        },
      }),
      this.prisma.appointment.count({
        where: {
          date: { gte: today, lt: tomorrow },
          status: { in: ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN'] },
          type: 'CONSULTATION',
        },
      }),
    ]);

    const todayRevenue = todayBills.reduce((sum, b) => sum + b.total, 0);
    const outstandingAmount = outstandingBills.reduce(
      (sum, b) => sum + b.total,
      0,
    );

    // Build doctor list with today's appointment count
    const doctorApptCounts = await this.prisma.appointment.groupBy({
      by: ['doctorId'],
      where: { date: { gte: today, lt: tomorrow } },
      _count: { _all: true },
    });
    const apptCountMap = new Map(doctorApptCounts.map((r) => [r.doctorId, r._count._all]));

    // Get doctor details via User model (polymorphic userable)
    const doctorUsers = await this.prisma.user.findMany({
      where: {
        userableType: 'Doctor',
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        userableId: true,
      },
    });

    const doctorAvailability = doctorUsers.map((u) => {
      const docId = u.userableId ?? u.id;
      return {
        name: `${u.firstName} ${u.lastName}`,
        doctorId: docId,
        appointmentCount: apptCountMap.get(docId) ?? 0,
        available: (apptCountMap.get(docId) ?? 0) < 20,
      };
    });

    return {
      todayAppointments,
      completedAppointments,
      pendingAppointments: todayAppointments - completedAppointments,
      patientsInQueue,
      registeredPatients,
      pendingPrescriptions,
      todayRevenue,
      outstandingAmount,
      lowStockMedicines,
      totalDoctors,
      activeDoctors: doctorsWithApptsToday,
      totalStaff,
      totalDepartments,
      totalActiveUsers,
      totalMedicines,
      opdCompleted,
      opdWaiting,
      opdTotal: opdCompleted + opdWaiting,
      latestAppointments,
      latestQueue,
      recentPatients,
      doctorAvailability,
    };
  }

  async getCharts() {
    const today = startOfDay(new Date());
    const rangeStart = addDays(today, -13);
    const weekStart = startOfWeek(today);
    const weekEnd = addDays(weekStart, 7);

    const [
      bills,
      appointmentsByStatus,
      dispensings,
      recentAppointments,
      recentBills,
      recentPrescriptions,
      weeklyAppointments,
      recentPatientRecords,
    ] = await Promise.all([
      this.prisma.bill.findMany({
        where: { createdAt: { gte: rangeStart } },
        select: { createdAt: true, total: true },
      }),
      this.prisma.appointment.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.dispensing.groupBy({
        by: ['medicineName'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 6,
      }),
      this.prisma.appointment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          createdAt: true,
          status: true,
          patient: { select: { firstName: true, lastName: true } },
          doctor: { select: { specialization: true, medicalRegistrationNo: true } },
        },
      }),
      this.prisma.bill.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          createdAt: true,
          total: true,
          status: true,
          invoiceNo: true,
        },
      }),
      this.prisma.prescription.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          createdAt: true,
          status: true,
          patient: { select: { firstName: true, lastName: true } },
          doctor: { select: { specialization: true, medicalRegistrationNo: true } },
        },
      }),
      this.prisma.appointment.findMany({
        where: { date: { gte: weekStart, lt: weekEnd } },
        select: { date: true, status: true },
      }),
      this.prisma.patient.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          patientCode: true,
          firstName: true,
          lastName: true,
          gender: true,
          dateOfBirth: true,
          createdAt: true,
          contactNo: true,
        },
      }),
    ]);

    // Revenue trend — bucket bills into day buckets
    const revenueByDay = new Map<string, number>();
    for (let i = 0; i < 14; i++) {
      revenueByDay.set(dateKey(addDays(rangeStart, i)), 0);
    }
    for (const bill of bills) {
      const key = dateKey(bill.createdAt);
      if (revenueByDay.has(key)) {
        revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + bill.total);
      }
    }
    const revenueTrend = Array.from(revenueByDay.entries()).map(
      ([date, revenue]) => ({ date, revenue }),
    );

    // Bill status breakdown
    const billsByStatus = await this.prisma.bill.groupBy({
      by: ['status'],
      _count: { _all: true },
      _sum: { total: true },
    });
    const billStatusBreakdown = billsByStatus.map((row) => ({
      status: row.status,
      count: row._count._all,
      amount: row._sum.total ?? 0,
    }));

    // Top medicines
    const topMedicines = dispensings.map((row) => ({
      medicine: row.medicineName,
      quantity: row._sum.quantity ?? 0,
    }));

    // Appointment status breakdown
    const appointmentStatusBreakdown = appointmentsByStatus
      .map((row) => ({ status: row.status, count: row._count._all }))
      .sort((a, b) => b.count - a.count);

    // Weekly appointment stats
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyStats = new Map<string, { total: number; completed: number; cancelled: number; noShow: number }>();
    for (let i = 0; i < 7; i++) {
      const d = addDays(weekStart, i);
      weeklyStats.set(dayNames[d.getDay()], { total: 0, completed: 0, cancelled: 0, noShow: 0 });
    }
    for (const appt of weeklyAppointments) {
      const d = new Date(appt.date);
      const dayName = dayNames[d.getDay()];
      const entry = weeklyStats.get(dayName);
      if (entry) {
        entry.total++;
        if (appt.status === 'COMPLETED') entry.completed++;
        if (appt.status === 'CANCELLED') entry.cancelled++;
        if (appt.status === 'NO_SHOW') entry.noShow++;
      }
    }
    const weeklyAppointmentStats = Array.from(weeklyStats.entries()).map(
      ([day, stats]) => ({ day, ...stats }),
    );

    // Revenue by category from bill items
    const billItems = await this.prisma.billItem.groupBy({
      by: ['itemName'],
      _sum: { amount: true },
      _count: { _all: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 10,
    });
    const revenueByCategory = billItems.map((row) => ({
      category: row.itemName,
      amount: row._sum.amount ?? 0,
      count: row._count._all,
    }));

    // Recent activity feed
    const recentActivity = [
      ...recentAppointments.map((a) => ({
        id: `appt-${a.id}`,
        type: 'appointment' as const,
        description: `${a.patient.firstName} ${a.patient.lastName} — appointment ${a.status.toLowerCase().replace(/_/g, ' ')}`,
        timestamp: a.createdAt.toISOString(),
        actor: a.doctor?.medicalRegistrationNo ?? 'System',
      })),
      ...recentBills.map((b) => ({
        id: `bill-${b.id}`,
        type: 'billing' as const,
        description: `Invoice ${b.invoiceNo} — ₹${b.total} (${b.status.toLowerCase()})`,
        timestamp: b.createdAt.toISOString(),
        actor: 'System',
      })),
      ...recentPrescriptions.map((p) => ({
        id: `rx-${p.id}`,
        type: 'prescription' as const,
        description: `${p.patient.firstName} ${p.patient.lastName} — prescription ${p.status.toLowerCase()}`,
        timestamp: p.createdAt.toISOString(),
        actor: p.doctor?.medicalRegistrationNo ?? 'Doctor',
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    return {
      revenueTrend,
      appointmentStatusBreakdown,
      billStatusBreakdown,
      topMedicines,
      recentActivity,
      weeklyAppointmentStats,
      revenueByCategory,
      recentPatients: recentPatientRecords,
    };
  }
}
