import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getDoctorNameMap } from '../common/utils/doctor-names';

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
      include: { patient: { select: { firstName: true, lastName: true, contactNo: true } } },
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
        patientName: bill.patient ? `${bill.patient.firstName} ${bill.patient.lastName}` : 'Unknown',
        patientPhone: bill.patient?.contactNo ?? '',
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
        patient: { select: { firstName: true, lastName: true } },
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
        patientName: `${rx.patient.firstName} ${rx.patient.lastName}`,
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
      select: { id: true, firstName: true, lastName: true, contactNo: true, createdAt: true },
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
        return { patientId: p.id, firstName: p.firstName, lastName: p.lastName, contactNo: p.contactNo, lastVisitDate: lastVisitDate.toISOString(), daysSinceLastVisit: daysSince };
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

  // ─── 10. Daily OPD Summary ─────────────────────────────────

  async getDailyOpdSummary(from?: string, to?: string, doctorId?: string) {
    // ─── Validate date parameters ────────────────────────────
    const start = from ? startOfDay(new Date(from)) : startOfDay(new Date());
    const end = to ? startOfDay(new Date(to)) : startOfDay(addDays(new Date(), 1));

    // Validate date format
    if (from && isNaN(start.getTime())) {
      throw new BadRequestException('Invalid date format for "from" parameter. Use YYYY-MM-DD format.');
    }
    if (to && isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date format for "to" parameter. Use YYYY-MM-DD format.');
    }

    // Validate date range
    if (start >= end) {
      throw new BadRequestException('Invalid date range: "from" date must be before "to" date.');
    }

    // Validate date range limit (max 1 year)
    const maxRangeMs = 365 * 24 * 60 * 60 * 1000;
    if (end.getTime() - start.getTime() > maxRangeMs) {
      throw new BadRequestException('Date range cannot exceed 1 year (365 days).');
    }

    // Validate doctorId if provided
    if (doctorId) {
      const doctor = await this.prisma.doctor.findUnique({ where: { id: doctorId } });
      if (!doctor) {
        throw new NotFoundException(`Doctor with ID "${doctorId}" not found.`);
      }
    }

    // Build appointment where clause
    const appointmentWhere: Record<string, unknown> = {
      date: { gte: start, lt: end },
      deletedAt: null,
    };
    if (doctorId) appointmentWhere.doctorId = doctorId;

    // Build bill where clause (bills are created on the same day as appointments)
    const billWhere: Record<string, unknown> = {
      createdAt: { gte: start, lt: end },
      status: { notIn: ['CANCELLED', 'REFUNDED'] },
      deletedAt: null,
    };
    if (doctorId) {
      billWhere.appointment = { doctorId };
    }

    // Execute all queries in parallel to avoid N+1
    const [
      appointments,
      bills,
      patientCounts,
    ] = await Promise.all([
      // Get all appointments for the period
      this.prisma.appointment.findMany({
        where: appointmentWhere,
        select: {
          id: true,
          patientId: true,
          doctorId: true,
          type: true,
          status: true,
          amount: true,
          registrationFee: true,
          createdAt: true,
          patient: {
            select: {
              id: true,
              isFollowUp: true,
              createdAt: true,
            },
          },
        },
      }),

      // Get all bills for the period
      this.prisma.bill.findMany({
        where: billWhere,
        select: {
          id: true,
          total: true,
          paidAmount: true,
          status: true,
          appointmentId: true,
        },
      }),

      // Get patient registration counts for new vs returning
      this.prisma.patient.groupBy({
        by: ['isFollowUp'],
        where: {
          createdAt: { gte: start, lt: end },
          deletedAt: null,
        },
        _count: { _all: true },
      }),
    ]);

    // ─── Calculate appointment metrics ──────────────────────
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(a => a.status === 'COMPLETED').length;
    const pendingAppointments = appointments.filter(a =>
      ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS'].includes(a.status)
    ).length;
    const cancelledAppointments = appointments.filter(a => a.status === 'CANCELLED').length;
    const noShowAppointments = appointments.filter(a => a.status === 'NO_SHOW').length;
    const walkInAppointments = appointments.filter(a => a.type === 'WALK_IN').length;

    // ─── Calculate patient metrics ──────────────────────────
    const newPatients = patientCounts.find(p => p.isFollowUp === false)?._count._all ?? 0;
    const returningPatients = patientCounts.find(p => p.isFollowUp === true)?._count._all ?? 0;

    // ─── Calculate revenue metrics ──────────────────────────
    const totalConsultationAmount = appointments.reduce((sum, a) => sum + a.amount, 0);
    const totalRegistrationAmount = appointments.reduce((sum, a) => sum + a.registrationFee, 0);
    const totalAmountCollected = bills.reduce((sum, b) => sum + b.paidAmount, 0);
    const pendingAmount = bills
      .filter(b => b.status === 'PENDING' || b.status === 'PARTIAL')
      .reduce((sum, b) => sum + (b.total - b.paidAmount), 0);
    const outstandingInvoices = bills.filter(b => b.status === 'PENDING' || b.status === 'PARTIAL').length;

    // ─── Calculate rates ────────────────────────────────────
    const completionRate = totalAppointments > 0
      ? +(completedAppointments / totalAppointments).toFixed(4)
      : 0;
    const cancellationRate = totalAppointments > 0
      ? +(cancelledAppointments / totalAppointments).toFixed(4)
      : 0;
    const noShowRate = totalAppointments > 0
      ? +(noShowAppointments / totalAppointments).toFixed(4)
      : 0;

    // ─── Build doctor breakdown ─────────────────────────────
    const doctorMap = new Map<string, {
      doctorId: string;
      totalAppointments: number;
      completed: number;
      revenue: number;
    }>();

    for (const appt of appointments) {
      const existing = doctorMap.get(appt.doctorId);
      if (existing) {
        existing.totalAppointments++;
        if (appt.status === 'COMPLETED') existing.completed++;
        existing.revenue += appt.amount;
      } else {
        doctorMap.set(appt.doctorId, {
          doctorId: appt.doctorId,
          totalAppointments: 1,
          completed: appt.status === 'COMPLETED' ? 1 : 0,
          revenue: appt.amount,
        });
      }
    }

    const byDoctor = Array.from(doctorMap.values()).sort((a, b) => b.revenue - a.revenue);

    // ─── Build type breakdown ───────────────────────────────
    const typeMap = new Map<string, number>();
    for (const appt of appointments) {
      typeMap.set(appt.type, (typeMap.get(appt.type) ?? 0) + 1);
    }
    const byType = Array.from(typeMap.entries())
      .map(([type, count]) => ({
        type,
        count,
        percentage: totalAppointments > 0 ? +(count / totalAppointments * 100).toFixed(1) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // ─── Build status breakdown ─────────────────────────────
    const statusMap = new Map<string, number>();
    for (const appt of appointments) {
      statusMap.set(appt.status, (statusMap.get(appt.status) ?? 0) + 1);
    }
    const byStatus = Array.from(statusMap.entries())
      .map(([status, count]) => ({
        status,
        count,
        percentage: totalAppointments > 0 ? +(count / totalAppointments * 100).toFixed(1) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // ─── Build hourly distribution ──────────────────────────
    const hourlyMap = new Map<number, number>();
    for (let h = 0; h < 24; h++) hourlyMap.set(h, 0);
    for (const appt of appointments) {
      const hour = appt.createdAt.getHours();
      hourlyMap.set(hour, (hourlyMap.get(hour) ?? 0) + 1);
    }
    const byHour = Array.from(hourlyMap.entries())
      .map(([hour, count]) => ({ hour, count }))
      .filter(h => h.count > 0);

    return {
      success: true,
      data: {
        summary: {
          totalAppointments,
          completedAppointments,
          pendingAppointments,
          cancelledAppointments,
          noShowAppointments,
          walkInAppointments,
          newPatients,
          returningPatients,
          totalConsultationAmount,
          totalRegistrationAmount,
          totalAmountCollected,
          pendingAmount,
          outstandingInvoices,
          completionRate,
          cancellationRate,
          noShowRate,
        },
        byDoctor,
        byType,
        byStatus,
        byHour,
      },
      meta: {
        from: start.toISOString().slice(0, 10),
        to: end.toISOString().slice(0, 10),
        generatedAt: new Date().toISOString(),
        filters: { doctorId },
      },
    };
  }

  // ─── 11. Doctor-wise OPD Report ────────────────────────────

  async getDoctorWiseOpdReport(from?: string, to?: string) {
    // ─── Validate date parameters ────────────────────────────
    const start = from ? startOfDay(new Date(from)) : startOfDay(addDays(new Date(), -30));
    const end = to ? startOfDay(new Date(to)) : startOfDay(addDays(new Date(), 1));

    // Validate date format
    if (from && isNaN(start.getTime())) {
      throw new BadRequestException('Invalid date format for "from" parameter. Use YYYY-MM-DD format.');
    }
    if (to && isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date format for "to" parameter. Use YYYY-MM-DD format.');
    }

    // Validate date range
    if (start >= end) {
      throw new BadRequestException('Invalid date range: "from" date must be before "to" date.');
    }

    // Validate date range limit (max 1 year)
    const maxRangeMs = 365 * 24 * 60 * 60 * 1000;
    if (end.getTime() - start.getTime() > maxRangeMs) {
      throw new BadRequestException('Date range cannot exceed 1 year (365 days).');
    }

    // Calculate number of days in range for averages
    const daysInRange = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));

    // ─── Execute parallel queries to avoid N+1 ────────────────
    const [
      doctors,
      appointments,
      bills,
      patientData,
    ] = await Promise.all([
      // Get all active doctors
      this.prisma.doctor.findMany({
        where: { isActive: true, deletedAt: null },
        select: {
          id: true,
          specialization: true,
          medicalRegistrationNo: true,
          consultationFee: true,
        },
      }),

      // Get all appointments in the date range
      this.prisma.appointment.findMany({
        where: {
          date: { gte: start, lt: end },
          deletedAt: null,
        },
        select: {
          id: true,
          doctorId: true,
          patientId: true,
          status: true,
          amount: true,
          patient: {
            select: {
              id: true,
              isFollowUp: true,
            },
          },
        },
      }),

      // Get all bills in the date range
      this.prisma.bill.findMany({
        where: {
          createdAt: { gte: start, lt: end },
          status: { notIn: ['CANCELLED', 'REFUNDED'] },
          deletedAt: null,
        },
        select: {
          id: true,
          total: true,
          paidAmount: true,
          appointmentId: true,
          appointment: {
            select: {
              doctorId: true,
            },
          },
        },
      }),

      // Get patient counts by doctor (new vs follow-up)
      this.prisma.appointment.groupBy({
        by: ['doctorId', 'patientId'],
        where: {
          date: { gte: start, lt: end },
          deletedAt: null,
        },
        _count: { _all: true },
      }),
    ]);

    // Track all unique patient IDs across all doctors (for summary totalPatients)
    const allUniquePatientIds = new Set<string>();

    // ─── Build doctor performance map ────────────────────────
    const doctorMap = new Map<string, {
      doctorId: string;
      specialization: string;
      registrationNo: string;
      consultationFee: number;
      totalAppointments: number;
      completed: number;
      cancelled: number;
      noShow: number;
      uniquePatients: Set<string>;
      newPatientIds: Set<string>;  // Track unique new patients
      followUpPatientIds: Set<string>;  // Track unique follow-up patients
      consultationRevenue: number;
    }>();

    // Initialize map for all doctors
    for (const doc of doctors) {
      doctorMap.set(doc.id, {
        doctorId: doc.id,
        specialization: doc.specialization ?? 'General',
        registrationNo: doc.medicalRegistrationNo,
        consultationFee: doc.consultationFee,
        totalAppointments: 0,
        completed: 0,
        cancelled: 0,
        noShow: 0,
        uniquePatients: new Set(),
        newPatientIds: new Set(),
        followUpPatientIds: new Set(),
        consultationRevenue: 0,
      });
    }

    // ─── Process appointments ─────────────────────────────────
    for (const appt of appointments) {
      const docData = doctorMap.get(appt.doctorId);
      if (!docData) continue; // Skip if doctor not found

      docData.totalAppointments++;
      docData.uniquePatients.add(appt.patientId);
      allUniquePatientIds.add(appt.patientId); // Track globally for summary

      // Count by status
      if (appt.status === 'COMPLETED') docData.completed++;
      if (appt.status === 'CANCELLED') docData.cancelled++;
      if (appt.status === 'NO_SHOW') docData.noShow++;

      // Track unique new vs follow-up patients (avoid duplicate counting)
      if (appt.patient) {
        if (appt.patient.isFollowUp) {
          docData.followUpPatientIds.add(appt.patientId);
        } else {
          docData.newPatientIds.add(appt.patientId);
        }
      }

      // Sum consultation revenue
      docData.consultationRevenue += appt.amount;
    }

    // ─── Process bills for additional revenue ─────────────────
    for (const bill of bills) {
      if (bill.appointment) {
        const docData = doctorMap.get(bill.appointment.doctorId);
        if (docData) {
          // Note: We're already counting revenue from appointments
          // This is for verification/future use if needed
        }
      }
    }

    // ─── Build final report ──────────────────────────────────
    const report = Array.from(doctorMap.values()).map((doc) => {
      const uniquePatientCount = doc.uniquePatients.size;
      const newPatientCount = doc.newPatientIds.size;
      const followUpPatientCount = doc.followUpPatientIds.size;
      const avgPatientsPerDay = daysInRange > 0
        ? +(uniquePatientCount / daysInRange).toFixed(2)
        : 0;
      const avgConsultationAmount = doc.totalAppointments > 0
        ? +(doc.consultationRevenue / doc.totalAppointments).toFixed(2)
        : 0;

      return {
        doctorId: doc.doctorId,
        specialization: doc.specialization,
        registrationNo: doc.registrationNo,
        consultationFee: doc.consultationFee,
        totalAppointments: doc.totalAppointments,
        completed: doc.completed,
        cancelled: doc.cancelled,
        noShow: doc.noShow,
        uniquePatients: uniquePatientCount,
        newPatients: newPatientCount,
        followUpPatients: followUpPatientCount,
        consultationRevenue: doc.consultationRevenue,
        avgPatientsPerDay,
        avgConsultationAmount,
      };
    });

    // Sort by total appointments descending
    report.sort((a, b) => b.totalAppointments - a.totalAppointments);

    // ─── Calculate summary ────────────────────────────────────
    const summary = {
      totalDoctors: doctors.length,
      activeDoctors: report.filter(d => d.totalAppointments > 0).length,
      totalAppointments: report.reduce((sum, d) => sum + d.totalAppointments, 0),
      totalRevenue: report.reduce((sum, d) => sum + d.consultationRevenue, 0),
      totalPatients: allUniquePatientIds.size, // Globally unique, not double-counted
      avgAppointmentsPerDoctor: report.length > 0
        ? +(report.reduce((sum, d) => sum + d.totalAppointments, 0) / report.length).toFixed(2)
        : 0,
    };

    return {
      success: true,
      data: {
        summary,
        doctors: report,
      },
      meta: {
        from: start.toISOString().slice(0, 10),
        to: end.toISOString().slice(0, 10),
        generatedAt: new Date().toISOString(),
      },
    };
  }

  // ─── 12. Revenue / Collection Report ────────────────────────

  async getRevenueCollectionReport(
    from?: string,
    to?: string,
    doctorId?: string,
    paymentStatus?: string,
    paymentMethod?: string,
    page: number = 1,
    limit: number = 50,
  ) {
    // ─── Validate date parameters ────────────────────────────
    const start = from ? startOfDay(new Date(from)) : startOfDay(addDays(new Date(), -30));
    const end = to ? startOfDay(new Date(to)) : startOfDay(addDays(new Date(), 1));

    // Validate date format
    if (from && isNaN(start.getTime())) {
      throw new BadRequestException('Invalid date format for "from" parameter. Use YYYY-MM-DD format.');
    }
    if (to && isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date format for "to" parameter. Use YYYY-MM-DD format.');
    }

    // Validate date range
    if (start >= end) {
      throw new BadRequestException('Invalid date range: "from" date must be before "to" date.');
    }

    // Validate date range limit (max 1 year)
    const maxRangeMs = 365 * 24 * 60 * 60 * 1000;
    if (end.getTime() - start.getTime() > maxRangeMs) {
      throw new BadRequestException('Date range cannot exceed 1 year (365 days).');
    }

    // Validate doctorId if provided
    if (doctorId) {
      const doctor = await this.prisma.doctor.findUnique({ where: { id: doctorId } });
      if (!doctor) {
        throw new NotFoundException(`Doctor with ID "${doctorId}" not found.`);
      }
    }

    // Validate paymentStatus if provided
    const validPaymentStatuses = ['PENDING', 'PAID', 'PARTIAL', 'CANCELLED', 'REFUNDED'];
    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      throw new BadRequestException(`Invalid payment status. Must be one of: ${validPaymentStatuses.join(', ')}`);
    }

    // Validate paymentMethod if provided
    const validPaymentMethods = ['CASH', 'CARD', 'UPI', 'ONLINE'];
    if (paymentMethod && !validPaymentMethods.includes(paymentMethod)) {
      throw new BadRequestException(`Invalid payment method. Must be one of: ${validPaymentMethods.join(', ')}`);
    }

    // ─── Build where clauses ─────────────────────────────────
    const appointmentWhere: Record<string, unknown> = {
      date: { gte: start, lt: end },
      deletedAt: null,
    };
    if (doctorId) appointmentWhere.doctorId = doctorId;

    const billWhere: Record<string, unknown> = {
      createdAt: { gte: start, lt: end },
      deletedAt: null,
    };
    if (paymentStatus) billWhere.status = paymentStatus;
    if (paymentMethod) billWhere.paymentMethod = paymentMethod;
    if (doctorId) billWhere.appointment = { doctorId };

    // ─── Execute parallel queries ─────────────────────────────
    const [appointments, bills] = await Promise.all([
      // Get all appointments in the date range
      this.prisma.appointment.findMany({
        where: appointmentWhere,
        select: {
          id: true,
          date: true,
          patientId: true,
          doctorId: true,
          amount: true,
          registrationFee: true,
          status: true,
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          doctor: {
            select: {
              id: true,
              specialization: true,
              medicalRegistrationNo: true,
            },
          },
          bill: {
            select: {
              id: true,
              invoiceNo: true,
              total: true,
              paidAmount: true,
              paymentMethod: true,
              referenceNumber: true,
              status: true,
            },
          },
        },
        orderBy: { date: 'desc' },
      }),

      // Get standalone bills (without appointments) in the date range
      this.prisma.bill.findMany({
        where: {
          ...billWhere,
          appointmentId: null,  // Only standalone bills
        },
        select: {
          id: true,
          invoiceNo: true,
          total: true,
          paidAmount: true,
          paymentMethod: true,
          referenceNumber: true,
          status: true,
          createdAt: true,
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // ─── Resolve doctor names (polymorphic: Doctor → User) ────
    const doctorIds = appointments
      .map(a => a.doctorId)
      .filter((id): id is string => !!id);
    const doctorNameMap = await getDoctorNameMap(this.prisma, doctorIds);

    // ─── Build report rows ────────────────────────────────────
    const rows: Array<{
      date: string;
      appointmentId: string | null;
      patientName: string;
      doctorName: string;
      registrationFee: number;
      consultationFee: number;
      otherAmount: number;
      totalAmount: number;
      amountPaid: number;
      amountPending: number;
      paymentMethod: string;
      transactionReference: string | null;
      invoiceNumber: string | null;
      paymentStatus: string;
    }> = [];

    // Process appointments with bills
    for (const appt of appointments) {
      const bill = appt.bill;
      const totalAmount = appt.amount + appt.registrationFee;
      const amountPaid = bill?.paidAmount ?? 0;
      const amountPending = totalAmount - amountPaid;

      // Apply payment status filter
      if (paymentStatus && bill?.status !== paymentStatus) {
        // If filtering by status and this appointment's bill doesn't match, skip
        // But also include appointments without bills if filtering for PENDING
        if (!(paymentStatus === 'PENDING' && !bill)) continue;
      }

      // Apply payment method filter
      if (paymentMethod && bill?.paymentMethod !== paymentMethod) continue;

      rows.push({
        date: appt.date.toISOString().slice(0, 10),
        appointmentId: appt.id,
        patientName: appt.patient
          ? `${appt.patient.firstName} ${appt.patient.lastName}`
          : 'Unknown',
        doctorName: doctorNameMap.get(appt.doctorId) ?? appt.doctor?.specialization ?? 'Unknown',
        registrationFee: appt.registrationFee,
        consultationFee: appt.amount,
        otherAmount: 0,  // No other amounts in current model
        totalAmount,
        amountPaid,
        amountPending: Math.max(0, amountPending),
        paymentMethod: bill?.paymentMethod ?? 'N/A',
        transactionReference: bill?.referenceNumber ?? null,
        invoiceNumber: bill?.invoiceNo ?? null,
        paymentStatus: bill?.status ?? 'NOT_BILLED',
      });
    }

    // Process standalone bills (without appointments)
    for (const bill of bills) {
      // Apply filters
      if (paymentStatus && bill.status !== paymentStatus) continue;
      if (paymentMethod && bill.paymentMethod !== paymentMethod) continue;

      rows.push({
        date: bill.createdAt.toISOString().slice(0, 10),
        appointmentId: null,
        patientName: bill.patient
          ? `${bill.patient.firstName} ${bill.patient.lastName}`
          : 'Unknown',
        doctorName: 'N/A',
        registrationFee: 0,
        consultationFee: 0,
        otherAmount: bill.total,  // Standalone bill amount
        totalAmount: bill.total,
        amountPaid: bill.paidAmount,
        amountPending: Math.max(0, bill.total - bill.paidAmount),
        paymentMethod: bill.paymentMethod,
        transactionReference: bill.referenceNumber,
        invoiceNumber: bill.invoiceNo,
        paymentStatus: bill.status,
      });
    }

    // Sort by date descending
    rows.sort((a, b) => b.date.localeCompare(a.date));

    // ─── Calculate summary (before pagination) ────────────────
    const totalRows = rows.length;
    const totalRegistrationFee = rows.reduce((sum, r) => sum + r.registrationFee, 0);
    const totalConsultationFee = rows.reduce((sum, r) => sum + r.consultationFee, 0);
    const totalOtherAmount = rows.reduce((sum, r) => sum + r.otherAmount, 0);
    const totalBilledAmount = rows.reduce((sum, r) => sum + r.totalAmount, 0);
    const totalPaidAmount = rows.reduce((sum, r) => sum + r.amountPaid, 0);
    const totalPendingAmount = rows.reduce((sum, r) => sum + r.amountPending, 0);

    const byPaymentMethod = this.groupBy(rows, 'paymentMethod').map(([method, items]) => ({
      method,
      count: items.length,
      amount: items.reduce((sum, r) => sum + r.totalAmount, 0),
    }));

    const byPaymentStatus = this.groupBy(rows, 'paymentStatus').map(([status, items]) => ({
      status,
      count: items.length,
      amount: items.reduce((sum, r) => sum + r.totalAmount, 0),
    }));

    // ─── Apply pagination ─────────────────────────────────────
    const skip = (page - 1) * limit;
    const paginatedRows = rows.slice(skip, skip + limit);
    const totalPages = Math.ceil(totalRows / limit);

    return {
      success: true,
      data: {
        summary: {
          totalRows,
          totalRegistrationFee,
          totalConsultationFee,
          totalOtherAmount,
          totalBilledAmount,
          totalPaidAmount,
          totalPendingAmount,
          byPaymentMethod,
          byPaymentStatus,
        },
        rows: paginatedRows,
      },
      pagination: {
        page,
        limit,
        totalPages,
        totalRecords: totalRows,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
      meta: {
        from: start.toISOString().slice(0, 10),
        to: end.toISOString().slice(0, 10),
        generatedAt: new Date().toISOString(),
        filters: { doctorId, paymentStatus, paymentMethod },
      },
    };
  }

  // ─── 13. Outstanding / Pending Payment Report ─────────────

  async getOutstandingPayments(
    from?: string,
    to?: string,
    doctorId?: string,
    patientId?: string,
    paymentStatus?: string,
    page: number = 1,
    limit: number = 50,
  ) {
    // ─── Validate date parameters ────────────────────────────
    const start = from ? startOfDay(new Date(from)) : startOfDay(addDays(new Date(), -90));
    const end = to ? startOfDay(new Date(to)) : startOfDay(addDays(new Date(), 1));

    if (from && isNaN(start.getTime())) {
      throw new BadRequestException('Invalid date format for "from" parameter. Use YYYY-MM-DD format.');
    }
    if (to && isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date format for "to" parameter. Use YYYY-MM-DD format.');
    }
    if (start >= end) {
      throw new BadRequestException('Invalid date range: "from" date must be before "to" date.');
    }
    const maxRangeMs = 365 * 24 * 60 * 60 * 1000;
    if (end.getTime() - start.getTime() > maxRangeMs) {
      throw new BadRequestException('Date range cannot exceed 1 year (365 days).');
    }

    if (doctorId) {
      const doctor = await this.prisma.doctor.findUnique({ where: { id: doctorId } });
      if (!doctor) throw new NotFoundException(`Doctor with ID "${doctorId}" not found.`);
    }
    if (patientId) {
      const patient = await this.prisma.patient.findUnique({ where: { id: patientId } });
      if (!patient) throw new NotFoundException(`Patient with ID "${patientId}" not found.`);
    }

    const validPaymentStatuses = ['PENDING', 'PAID', 'PARTIAL', 'CANCELLED', 'REFUNDED'];
    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
      throw new BadRequestException(`Invalid payment status. Must be one of: ${validPaymentStatuses.join(', ')}`);
    }

    // ─── Build where clause ───────────────────────────────────
    // Default: show only outstanding (PENDING or PARTIAL) bills
    const billWhere: Record<string, unknown> = {
      createdAt: { gte: start, lt: end },
      deletedAt: null,
    };

    if (paymentStatus) {
      billWhere.status = paymentStatus;
    } else {
      // Default: only outstanding (PENDING or PARTIAL)
      billWhere.status = { in: ['PENDING', 'PARTIAL'] };
    }

    if (patientId) billWhere.patientId = patientId;

    // Filter by doctor via appointment relation
    if (doctorId) {
      billWhere.appointment = { doctorId };
    }

    // ─── Query bills ──────────────────────────────────────────
    const bills = await this.prisma.bill.findMany({
      where: billWhere,
      select: {
        id: true,
        invoiceNo: true,
        total: true,
        paidAmount: true,
        status: true,
        paymentMethod: true,
        referenceNumber: true,
        createdAt: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            contactNo: true,
          },
        },
        appointment: {
          select: {
            id: true,
            date: true,
            doctorId: true,
            doctor: {
              select: {
                id: true,
                specialization: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // ─── Resolve doctor names (polymorphic: Doctor → User) ────
    const doctorIds = bills
      .map(b => b.appointment?.doctorId)
      .filter((id): id is string => !!id);
    const doctorNameMap = await getDoctorNameMap(this.prisma, doctorIds);

    // ─── Map to rows ──────────────────────────────────────────
    const rows = bills.map((bill) => {
      const pendingAmount = bill.total - bill.paidAmount;
      return {
        id: bill.id,
        invoiceNo: bill.invoiceNo,
        patientId: bill.patient?.id ?? null,
        patientName: bill.patient
          ? `${bill.patient.firstName} ${bill.patient.lastName}`
          : 'Unknown',
        patientPhone: bill.patient?.contactNo ?? null,
        appointmentId: bill.appointment?.id ?? null,
        appointmentDate: bill.appointment?.date?.toISOString().slice(0, 10) ?? null,
        doctorId: bill.appointment?.doctorId ?? null,
        doctorName: (bill.appointment?.doctorId
          ? doctorNameMap.get(bill.appointment.doctorId)
          : null) ?? 'N/A',
        doctorSpecialization: bill.appointment?.doctor?.specialization ?? null,
        totalAmount: bill.total,
        paidAmount: bill.paidAmount,
        pendingAmount,
        paymentMethod: bill.paymentMethod,
        referenceNumber: bill.referenceNumber,
        status: bill.status,
        createdAt: bill.createdAt.toISOString(),
      };
    });

    // ─── Summary totals ───────────────────────────────────────
    const totalRecords = rows.length;
    const totalBilledAmount = rows.reduce((sum, r) => sum + r.totalAmount, 0);
    const totalPaidAmount = rows.reduce((sum, r) => sum + r.paidAmount, 0);
    const totalPendingAmount = rows.reduce((sum, r) => sum + r.pendingAmount, 0);

    // Aging buckets
    const now = Date.now();
    const agingBuckets = [
      { bucket: '0-30 days', min: 0, max: 30, count: 0, amount: 0 },
      { bucket: '31-60 days', min: 31, max: 60, count: 0, amount: 0 },
      { bucket: '61-90 days', min: 61, max: 90, count: 0, amount: 0 },
      { bucket: '90+ days', min: 91, max: Infinity, count: 0, amount: 0 },
    ];
    for (const row of rows) {
      const ageDays = Math.floor((now - new Date(row.createdAt).getTime()) / 86400000);
      for (const bucket of agingBuckets) {
        if (ageDays >= bucket.min && ageDays <= bucket.max) {
          bucket.count += 1;
          bucket.amount += row.pendingAmount;
          break;
        }
      }
    }

    // By status breakdown
    const statusMap = new Map<string, { count: number; amount: number }>();
    for (const row of rows) {
      const existing = statusMap.get(row.status) ?? { count: 0, amount: 0 };
      existing.count += 1;
      existing.amount += row.pendingAmount;
      statusMap.set(row.status, existing);
    }
    const byStatus = Array.from(statusMap.entries()).map(([status, data]) => ({
      status,
      ...data,
    }));

    // ─── Apply pagination ─────────────────────────────────────
    const skip = (page - 1) * limit;
    const paginatedRows = rows.slice(skip, skip + limit);
    const totalPages = Math.ceil(totalRecords / limit);

    return {
      success: true,
      data: {
        summary: {
          totalRecords,
          totalBilledAmount,
          totalPaidAmount,
          totalPendingAmount,
          agingBuckets,
          byStatus,
        },
        rows: paginatedRows,
      },
      pagination: {
        page,
        limit,
        totalPages,
        totalRecords,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
      meta: {
        from: start.toISOString().slice(0, 10),
        to: end.toISOString().slice(0, 10),
        generatedAt: new Date().toISOString(),
        filters: { doctorId, patientId, paymentStatus },
      },
    };
  }

  // ─── Helper: Group by key ──────────────────────────────────
  private groupBy<T>(array: T[], key: keyof T): [string, T[]][] {
    const map = new Map<string, T[]>();
    for (const item of array) {
      const value = String(item[key]);
      if (!map.has(value)) map.set(value, []);
      map.get(value)!.push(item);
    }
    return Array.from(map.entries());
  }
}
