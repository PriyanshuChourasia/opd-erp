import { Controller, Get, Post, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ReportsService } from './reports.service';
import { ReportDateRangeDto, ReportPaginationDto } from './dto/report-date-range.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Permissions('read:reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  // ─── 1. Revenue by Category ───
  @Get('revenue-by-category')
  getRevenueByCategory(@Query() query: ReportDateRangeDto) {
    return this.service.getRevenueByCategory(query.from, query.to);
  }

  // ─── 2. Outstanding Bills ───
  @Get('outstanding-bills')
  getOutstandingBills() {
    return this.service.getOutstandingBills();
  }

  // ─── 3. Doctor Performance ───
  @Get('doctor-performance')
  getDoctorPerformance(@Query() query: ReportDateRangeDto) {
    return this.service.getDoctorPerformance(query.from, query.to);
  }

  // ─── 4. Prescription Fulfillment ───
  @Get('prescription-fulfillment')
  getPrescriptionFulfillment(@Query() query: ReportDateRangeDto) {
    return this.service.getPrescriptionFulfillment(query.from, query.to);
  }

  // ─── 5. Top Medicines ───
  @Get('top-medicines')
  getTopMedicines(@Query() query: ReportDateRangeDto & { limit?: string }) {
    return this.service.getTopMedicines(query.from, query.to, query.limit ? Number(query.limit) : undefined);
  }

  // ─── 6. Patient Demographics ───
  @Get('patient-demographics')
  getPatientDemographics() {
    return this.service.getPatientDemographics();
  }

  // ─── 7. Inactive Patients ───
  @Get('inactive-patients')
  getInactivePatients(@Query() query: ReportPaginationDto & { daysSinceLastVisit?: number }) {
    return this.service.getInactivePatients(
      query.daysSinceLastVisit ?? 90,
      query.page ?? 1,
      query.limit ?? 100,
    );
  }

  // ─── 8. Diagnostics Turnaround ───
  @Get('diagnostics-turnaround')
  getDiagnosticsTurnaround(@Query() query: ReportDateRangeDto) {
    return this.service.getDiagnosticsTurnaround(query.from, query.to);
  }

  // ─── 9. Appointment Mix ───
  @Get('appointment-mix')
  getAppointmentMix(@Query() query: ReportDateRangeDto) {
    return this.service.getAppointmentMix(query.from, query.to);
  }

  // ─── 10. Daily OPD Summary ───
  @Get('daily-opd-summary')
  getDailyOpdSummary(@Query() query: ReportDateRangeDto) {
    return this.service.getDailyOpdSummary(query.from, query.to, query.doctorId);
  }

  // ─── 11. Doctor-wise OPD Report ───
  @Get('doctor-wise-opd')
  getDoctorWiseOpdReport(@Query() query: ReportDateRangeDto) {
    return this.service.getDoctorWiseOpdReport(query.from, query.to);
  }

  // ─── 12. Revenue / Collection Report ───
  @Get('revenue-collection')
  getRevenueCollectionReport(
    @Query() query: ReportPaginationDto & {
      paymentStatus?: string;
      paymentMethod?: string;
    },
  ) {
    return this.service.getRevenueCollectionReport(
      query.from,
      query.to,
      query.doctorId,
      query.paymentStatus,
      query.paymentMethod,
      query.page ?? 1,
      query.limit ?? 50,
    );
  }

  // ─── 13. Outstanding / Pending Payment Report ───
  @Get('outstanding-payments')
  getOutstandingPayments(
    @Query() query: ReportPaginationDto & {
      patientId?: string;
      paymentStatus?: string;
    },
  ) {
    return this.service.getOutstandingPayments(
      query.from,
      query.to,
      query.doctorId,
      query.patientId,
      query.paymentStatus,
      query.page ?? 1,
      query.limit ?? 50,
    );
  }
}
