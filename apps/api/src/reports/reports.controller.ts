import { Controller, Get, Post, Delete, Param, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ReportDateRangeDto, ReportPaginationDto } from './dto/report-date-range.dto';

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
}
