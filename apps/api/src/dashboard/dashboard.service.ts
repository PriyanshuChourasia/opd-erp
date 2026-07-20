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

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const today = startOfDay(new Date());
    const tomorrow = addDays(today, 1);

    const [todayAppointments, patientsInQueue, registeredPatients, pendingPrescriptions, todayBills] = await Promise.all([
      this.prisma.appointment.count({ where: { date: { gte: today, lt: tomorrow } } }),
      this.prisma.queueEntry.count({
        where: { queueDate: { gte: today, lt: tomorrow }, status: { in: ['WAITING', 'IN_PROGRESS'] } },
      }),
      this.prisma.patient.count(),
      this.prisma.prescription.count({ where: { status: 'ACTIVE' } }),
      this.prisma.bill.findMany({
        where: { createdAt: { gte: today, lt: tomorrow }, status: { notIn: ['CANCELLED', 'REFUNDED'] } },
        select: { total: true },
      }),
    ]);

    const todayRevenue = todayBills.reduce((sum, b) => sum + b.total, 0);

    return { todayAppointments, patientsInQueue, registeredPatients, pendingPrescriptions, todayRevenue };
  }

  async getCharts() {
    const today = startOfDay(new Date());
    const rangeStart = addDays(today, -13); // last 14 days inclusive of today

    const [bills, appointmentsByStatus, appointments, doctors, dispensings, recentAppointments, recentBills, recentPrescriptions] =
      await Promise.all([
        this.prisma.bill.findMany({
          where: { createdAt: { gte: rangeStart } },
          select: { createdAt: true, total: true },
        }),
        this.prisma.appointment.groupBy({ by: ['status'], _count: { _all: true } }),
        this.prisma.appointment.groupBy({ by: ['doctorId'], _count: { _all: true } }),
        this.prisma.doctor.findMany({ select: { id: true, specialization: true } }),
        this.prisma.dispensing.groupBy({
          by: ['medicineName'],
          _sum: { quantity: true },
          orderBy: { _sum: { quantity: 'desc' } },
          take: 6,
        }),
        this.prisma.appointment.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, createdAt: true, status: true, patient: { select: { name: true } } },
        }),
        this.prisma.bill.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, createdAt: true, total: true, status: true, invoiceNo: true },
        }),
        this.prisma.prescription.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, createdAt: true, status: true, patient: { select: { name: true } } },
        }),
      ]);

    // Revenue trend — bucket bills into day buckets across the 14-day window.
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
    const revenueTrend = Array.from(revenueByDay.entries()).map(([date, revenue]) => ({ date, revenue }));

    // Bill status breakdown (with revenue sum per status), all-time.
    const billStatusMap = new Map<string, { count: number; amount: number }>();
    const billsByStatus = await this.prisma.bill.groupBy({
      by: ['status'],
      _count: { _all: true },
      _sum: { total: true },
    });
    for (const row of billsByStatus) {
      billStatusMap.set(row.status, { count: row._count._all, amount: row._sum.total ?? 0 });
    }
    const billStatusBreakdown = Array.from(billStatusMap.entries()).map(([status, v]) => ({
      status,
      count: v.count,
      amount: v.amount,
    }));

    const doctorNameById = new Map(doctors.map((d) => [d.id, d.specialization ?? 'Unknown']));
    const doctorLoad = appointments
      .map((row) => ({ doctor: `Doctor (${doctorNameById.get(row.doctorId) ?? 'Unknown'})`, count: row._count._all }))
      .sort((a, b) => b.count - a.count);

    const topMedicines = dispensings.map((row) => ({
      medicine: row.medicineName,
      quantity: row._sum.quantity ?? 0,
    }));

    const appointmentStatusBreakdown = appointmentsByStatus
      .map((row) => ({ status: row.status, count: row._count._all }))
      .sort((a, b) => b.count - a.count);

    const recentActivity = [
      ...recentAppointments.map((a) => ({
        id: `appt-${a.id}`,
        type: 'appointment',
        description: `${a.patient.name} — appointment ${a.status.toLowerCase().replace(/_/g, ' ')}`,
        timestamp: a.createdAt.toISOString(),
      })),
      ...recentBills.map((b) => ({
        id: `bill-${b.id}`,
        type: 'billing',
        description: `Invoice ${b.invoiceNo} — ₹${b.total} (${b.status.toLowerCase()})`,
        timestamp: b.createdAt.toISOString(),
      })),
      ...recentPrescriptions.map((p) => ({
        id: `rx-${p.id}`,
        type: 'prescription',
        description: `${p.patient.name} — prescription ${p.status.toLowerCase()}`,
        timestamp: p.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8);

    return {
      revenueTrend,
      appointmentStatusBreakdown,
      doctorLoad,
      billStatusBreakdown,
      topMedicines,
      recentActivity,
    };
  }
}
