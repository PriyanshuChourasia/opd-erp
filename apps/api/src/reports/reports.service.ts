import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// ─── Date helpers (moved here from dashboard.service.ts) ────

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── 1. Revenue by Category & Payment Method ─────────────

  async getRevenueByCategory(from?: string, to?: string) {
    const start = from ? new Date(from) : startOfDay(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const end = to ? new Date(to) : startOfDay(addDays(new Date(), 1));

    // BillItem grouped by itemType
    const billItems = await this.prisma.bill.findMany({
      where: {
        createdAt: { gte: start, lt: end },
        status: { notIn: ['CANCELLED', 'REFUNDED'] },
      },
      include: { items: true },
    });

    const byCategoryMap = new Map<string, number>();
    for (const bill of billItems) {
      for (const item of bill.items) {
        byCategoryMap.set(item.itemType, (byCategoryMap.get(item.itemType) ?? 0) + item.amount);
      }
    }
    const byCategory = Array.from(byCategoryMap.entries())
      .map(([itemType, amount]) => ({ itemType, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Bills grouped by paymentMethod
    const byPaymentMethodMap = new Map<string, number>();
    for (const bill of billItems) {
      byPaymentMethodMap.set(bill.paymentMethod, (byPaymentMethodMap.get(bill.paymentMethod) ?? 0) + bill.total);
    }
    const byPaymentMethod = Array.from(byPaymentMethodMap.entries())
      .map(([paymentMethod, amount]) => ({ paymentMethod, amount }))
      .sort((a, b) => b.amount - a.amount);

    const totalRevenue = billItems.reduce((sum, b) => sum + b.total, 0);

    return { data: { byCategory, byPaymentMethod, totalRevenue } };
  }

  // ─── 2. Outstanding / Aging Bills ────────────────────────

  async getOutstandingBills() {
    const bills = await this.prisma.bill.findMany({
      where: { status: { in: ['PENDING', 'PARTIAL'] } },
      include: { patient: { select: { name: true, phone: true } } },
      orderBy: { createdAt: 'asc' },
    });

    const now = Date.now();
    const bucketDefs = [
      { bucket: '0-7', min: 0, max: 7 },
      { bucket: '8-30', min: 8, max: 30 },
      { bucket: '31+', min: 31, max: Infinity },
    ];
    const bucketSummary = bucketDefs.map((b) => ({ bucket: b.bucket, min: b.min, max: b.max, count: 0, amount: 0 }));

    const mapped = bills.map((bill) => {
      const ageDays = Math.floor((now - bill.createdAt.getTime()) / 86400000);
      for (const b of bucketSummary) {
        if (ageDays >= b.min && ageDays <= b.max) {
          b.count += 1;
          b.amount += bill.total;
          break;
        }
      }
      return {
        id: bill.id,
        invoiceNo: bill.invoiceNo,
        patientName: bill.patient?.name ?? 'Unknown',
        patientPhone: bill.patient?.phone ?? '',
        total: bill.total,
        status: bill.status,
        ageDays,
        createdAt: bill.createdAt.toISOString(),
      };
    });

    mapped.sort((a, b) => b.ageDays - a.ageDays);

    return { data: { bills: mapped, bucketSummary } };
  }

  // ─── 3. Doctor Performance ───────────────────────────────

  async getDoctorPerformance(from?: string, to?: string) {
    const start = from ? new Date(from) : startOfDay(addDays(new Date(), -30));
    const end = to ? new Date(to) : startOfDay(addDays(new Date(), 1));

    const doctors = await this.prisma.doctor.findMany({
      select: { id: true, specialization: true, medicalRegistrationNo: true, consultationFee: true },
    });

    // Get appointment counts per doctor per status
    const appointmentStats = await this.prisma.appointment.groupBy({
      by: ['doctorId', 'status'],
      where: { date: { gte: start, lt: end } },
      _count: { _all: true },
    });

    // Get bill totals for completed appointments per doctor
    const bills = await this.prisma.bill.findMany({
      where: {
        createdAt: { gte: start, lt: end },
        status: { notIn: ['CANCELLED', 'REFUNDED'] },
        appointment: { doctorId: { not: undefined } },
      },
      include: { appointment: { select: { doctorId: true } } },
    });

    const revenueByDoctor = new Map<string, number>();
    for (const bill of bills) {
      if (bill.appointment) {
        revenueByDoctor.set(bill.appointment.doctorId, (revenueByDoctor.get(bill.appointment.doctorId) ?? 0) + bill.total);
      }
    }

    const data = doctors.map((doc) => {
      const docStats = appointmentStats.filter((s) => s.doctorId === doc.id);
      const totalAppts = docStats.reduce((sum, s) => sum + s._count._all, 0);
      const completedCount = docStats.find((s) => s.status === 'COMPLETED')?._count._all ?? 0;
      const noShowCount = docStats.find((s) => s.status === 'NO_SHOW')?._count._all ?? 0;
      const noShowRate = totalAppts > 0 ? +(noShowCount / totalAppts).toFixed(4) : 0;
      const revenue = revenueByDoctor.get(doc.id) ?? 0;

      return {
        doctorId: doc.id,
        specialization: doc.specialization ?? 'General',
        registrationNo: doc.medicalRegistrationNo,
        consultationFee: doc.consultationFee,
        totalAppointments: totalAppts,
        completedCount,
        noShowCount,
        noShowRate,
        revenue,
      };
    });

    data.sort((a, b) => b.revenue - a.revenue);

    return { data };
  }

  // ─── 4. Prescription Fulfillment ─────────────────────────

  async getPrescriptionFulfillment(from?: string, to?: string) {
    const start = from ? new Date(from) : startOfDay(addDays(new Date(), -90));
    const end = to ? new Date(to) : startOfDay(addDays(new Date(), 1));

    const prescriptions = await this.prisma.prescription.findMany({
      where: { createdAt: { gte: start, lt: end } },
      include: {
        patient: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Status breakdown
    const statusMap = new Map<string, number>();
    for (const rx of prescriptions) {
      statusMap.set(rx.status, (statusMap.get(rx.status) ?? 0) + 1);
    }
    const statusBreakdown = Array.from(statusMap.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);

    // Unfulfilled (ACTIVE older than 3 days)
    const threeDaysAgo = addDays(new Date(), -3);
    const unfulfilled = prescriptions
      .filter((rx) => rx.status === 'ACTIVE' && rx.createdAt < threeDaysAgo)
      .map((rx) => ({
        prescriptionId: rx.id,
        patientName: rx.patient.name,
        doctorId: rx.doctorId,
        daysPending: Math.floor((Date.now() - rx.createdAt.getTime()) / 86400000),
      }))
      .sort((a, b) => b.daysPending - a.daysPending);

    return { data: { statusBreakdown, unfulfilled } };
  }

  // ─── 5. Top Medicines by Volume and Revenue ──────────────

  async getTopMedicines(from?: string, to?: string, limit = 10) {
    const start = from ? new Date(from) : startOfDay(addDays(new Date(), -90));
    const end = to ? new Date(to) : startOfDay(addDays(new Date(), 1));

    const [dispensings, billItems] = await Promise.all([
      this.prisma.dispensing.groupBy({
        by: ['medicineName'],
        where: { dispensedAt: { gte: start, lt: end } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: limit,
      }),
      this.prisma.billItem.groupBy({
        by: ['itemName'],
        where: {
          itemType: 'MEDICINE',
          bill: { createdAt: { gte: start, lt: end } },
        },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: limit,
      }),
    ]);

    const byVolume = dispensings.map((d) => ({
      medicine: d.medicineName,
      quantity: d._sum.quantity ?? 0,
    }));

    const byRevenue = billItems.map((b) => ({
      medicine: b.itemName,
      amount: b._sum.amount ?? 0,
    }));

    return { data: { byVolume, byRevenue } };
  }

  // ─── 6. Patient Demographics ─────────────────────────────

  async getPatientDemographics() {
    const patients = await this.prisma.patient.findMany({
      select: { gender: true, bloodGroup: true, dateOfBirth: true, isFollowUp: true, createdAt: true },
    });

    // By gender
    const genderMap = new Map<string, number>();
    for (const p of patients) {
      if (p.gender) {
        genderMap.set(p.gender, (genderMap.get(p.gender) ?? 0) + 1);
      }
    }
    const byGender = Array.from(genderMap.entries())
      .map(([gender, count]) => ({ gender, count }))
      .sort((a, b) => b.count - a.count);

    // By blood group
    const bloodMap = new Map<string, number>();
    for (const p of patients) {
      if (p.bloodGroup) {
        bloodMap.set(p.bloodGroup, (bloodMap.get(p.bloodGroup) ?? 0) + 1);
      }
    }
    const byBloodGroup = Array.from(bloodMap.entries())
      .map(([bloodGroup, count]) => ({ bloodGroup, count }))
      .sort((a, b) => b.count - a.count);

    // By age group
    const now = new Date();
    const ageBuckets = [
      { bucket: '0-17', min: 0, max: 17, count: 0 },
      { bucket: '18-35', min: 18, max: 35, count: 0 },
      { bucket: '36-55', min: 36, max: 55, count: 0 },
      { bucket: '56+', min: 56, max: Infinity, count: 0 },
    ];
    for (const p of patients) {
      if (!p.dateOfBirth) continue;
      const age = Math.floor((now.getTime() - p.dateOfBirth.getTime()) / 31557600000); // approx years
      for (const b of ageBuckets) {
        const [minStr, maxStr] = b.bucket.split('-');
        const min = parseInt(minStr, 10);
        const max = maxStr === '+' ? Infinity : parseInt(maxStr, 10);
        if (age >= min && age <= max) {
          b.count += 1;
          break;
        }
      }
    }
    const byAgeGroup = ageBuckets.map((b) => ({ ageGroup: b.bucket, count: b.count }));

    // New vs returning (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const monthBuckets = new Map<string, { newCount: number; followUpCount: number }>();
    for (let i = 0; i < 12; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthBuckets.set(key, { newCount: 0, followUpCount: 0 });
    }

    for (const p of patients) {
      if (p.createdAt < twelveMonthsAgo) continue;
      const key = `${p.createdAt.getFullYear()}-${String(p.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (monthBuckets.has(key)) {
        const bucket = monthBuckets.get(key)!;
        if (p.isFollowUp) {
          bucket.followUpCount += 1;
        } else {
          bucket.newCount += 1;
        }
      }
    }

    const newVsReturningTrend = Array.from(monthBuckets.entries())
      .map(([month, counts]) => ({ month, ...counts }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return { data: { byGender, byBloodGroup, byAgeGroup, newVsReturningTrend } };
  }

  // ─── 7. Inactive / Lapsed Patients ───────────────────────

  async getInactivePatients(daysSinceLastVisit = 90, page = 1, limit = 100) {
    const threshold = addDays(new Date(), -daysSinceLastVisit);

    const activePatients = await this.prisma.patient.findMany({
      where: { isActive: true },
      select: { id: true, name: true, phone: true, createdAt: true },
    });

    // For each patient, find their most recent appointment date
    const patientIds = activePatients.map((p) => p.id);
    const recentAppointments = await this.prisma.appointment.groupBy({
      by: ['patientId'],
      where: { patientId: { in: patientIds } },
      _max: { date: true },
    });

    const lastVisitMap = new Map(recentAppointments.map((a) => [a.patientId, a._max.date]));

    const now = Date.now();
    const inactive = activePatients
      .map((p) => {
        const lastVisitDate = lastVisitMap.get(p.id) ?? p.createdAt;
        const daysSince = Math.floor((now - lastVisitDate.getTime()) / 86400000);
        return { patientId: p.id, name: p.name, phone: p.phone, lastVisitDate: lastVisitDate.toISOString(), daysSinceLastVisit: daysSince };
      })
      .filter((p) => p.daysSinceLastVisit >= daysSinceLastVisit)
      .sort((a, b) => b.daysSinceLastVisit - a.daysSinceLastVisit);

    const total = inactive.length;
    const skip = (page - 1) * limit;
    const paged = inactive.slice(skip, skip + limit);

    return {
      data: paged,
      meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  // ─── 8. Diagnostics Turnaround ───────────────────────────

  async getDiagnosticsTurnaround(from?: string, to?: string) {
    const start = from ? new Date(from) : startOfDay(addDays(new Date(), -90));
    const end = to ? new Date(to) : startOfDay(addDays(new Date(), 1));

    const [labOrders, radiologyOrders, procedureOrders] = await Promise.all([
      this.prisma.labOrder.findMany({
        where: { createdAt: { gte: start, lt: end } },
        select: { id: true, createdAt: true, resultDate: true, status: true, category: true },
      }),
      this.prisma.radiologyOrder.findMany({
        where: { createdAt: { gte: start, lt: end } },
        select: { id: true, createdAt: true, resultDate: true, status: true, category: true },
      }),
      this.prisma.procedureOrder.findMany({
        where: { createdAt: { gte: start, lt: end } },
        select: { id: true, createdAt: true, resultDate: true, status: true, category: true },
      }),
    ]);

    // Compute turnaround for completed orders with resultDate
    const computeAvgTurnaround = (
      orders: { createdAt: Date; resultDate: Date | null; status: string; category: string | null }[],
      orderType: string,
    ) => {
      const completed = orders.filter((o) => o.status === 'COMPLETED' && o.resultDate);
      if (completed.length === 0) return [];

      const byCategory = new Map<string, { totalHours: number; count: number }>();
      for (const order of completed) {
        const hours = (order.resultDate!.getTime() - order.createdAt.getTime()) / 3600000;
        const cat = order.category ?? 'Other';
        if (!byCategory.has(cat)) byCategory.set(cat, { totalHours: 0, count: 0 });
        const entry = byCategory.get(cat)!;
        entry.totalHours += hours;
        entry.count += 1;
      }

      return Array.from(byCategory.entries()).map(([category, { totalHours, count }]) => ({
        orderType,
        category,
        avgHours: +(totalHours / count).toFixed(1),
        count,
      }));
    };

    const avgTurnaroundByType = [
      ...computeAvgTurnaround(labOrders, 'Lab'),
      ...computeAvgTurnaround(radiologyOrders, 'Radiology'),
      ...computeAvgTurnaround(procedureOrders, 'Procedure'),
    ];

    // Status breakdown per order type
    const buildStatusBreakdown = (orders: { status: string }[], orderType: string) => {
      const map = new Map<string, number>();
      for (const o of orders) {
        map.set(o.status, (map.get(o.status) ?? 0) + 1);
      }
      return Array.from(map.entries()).map(([status, count]) => ({ orderType, status, count }));
    };

    const statusBreakdown = [
      ...buildStatusBreakdown(labOrders, 'Lab'),
      ...buildStatusBreakdown(radiologyOrders, 'Radiology'),
      ...buildStatusBreakdown(procedureOrders, 'Procedure'),
    ];

    return { data: { avgTurnaroundByType, statusBreakdown } };
  }

  // ─── 9. Appointment Mix & Cancellation Reasons ───────────

  async getAppointmentMix(from?: string, to?: string) {
    const start = from ? new Date(from) : startOfDay(addDays(new Date(), -90));
    const end = to ? new Date(to) : startOfDay(addDays(new Date(), 1));

    const appointments = await this.prisma.appointment.findMany({
      where: { date: { gte: start, lt: end } },
      select: { type: true, status: true, cancellationReason: true },
    });

    // By type
    const typeMap = new Map<string, number>();
    for (const a of appointments) {
      typeMap.set(a.type, (typeMap.get(a.type) ?? 0) + 1);
    }
    const byType = Array.from(typeMap.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    // By status
    const statusMap = new Map<string, number>();
    for (const a of appointments) {
      statusMap.set(a.status, (statusMap.get(a.status) ?? 0) + 1);
    }
    const byStatus = Array.from(statusMap.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);

    // Cancellation reasons
    const reasonMap = new Map<string, number>();
    for (const a of appointments) {
      if (a.status === 'CANCELLED') {
        const reason = a.cancellationReason ?? 'Not specified';
        reasonMap.set(reason, (reasonMap.get(reason) ?? 0) + 1);
      }
    }
    const cancellationReasons = Array.from(reasonMap.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count);

    return { data: { byType, byStatus, cancellationReasons } };
  }
}
