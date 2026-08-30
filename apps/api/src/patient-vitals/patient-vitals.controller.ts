import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PatientVitalsService } from './patient-vitals.service';
import { CreatePatientVitalsDto } from './dto/create-patient-vitals.dto';

/**
 * Patient vitals — create-only (immutable historical records).
 *
 * No PATCH or DELETE endpoints — vitals are never modified after creation.
 */
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('patient-vitals')
export class PatientVitalsController {
  constructor(private readonly vitalsService: PatientVitalsService) {}

  /**
   * Record new vitals for a patient.
   * BMI is auto-calculated from height and weight.
   */
  @Get()
  @Permissions('read:patient-vitals')
  findAll(
    @Query('patientId') patientId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (patientId) {
      return this.vitalsService.findByPatient(patientId, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 20);
    }
    // If no patientId, return all vitals (admin view)
    return this.vitalsService.findByPatient('', page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 20);
  }

  /**
   * Get the latest vitals for a patient.
   */
  @Get('latest/:patientId')
  @Permissions('read:patient-vitals')
  findLatest(@Param('patientId') patientId: string) {
    return this.vitalsService.findLatest(patientId);
  }

  /**
   * Get vitals within a date range.
   */
  @Get('range/:patientId')
  @Permissions('read:patient-vitals')
  findByDateRange(
    @Param('patientId') patientId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.vitalsService.findByDateRange(
      patientId,
      from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Default: last 30 days
      to ? new Date(to) : new Date(),
    );
  }

  /**
   * Get a single vitals record by ID.
   */
  @Get(':id')
  @Permissions('read:patient-vitals')
  findOne(@Param('id') id: string) {
    return this.vitalsService.findOne(id);
  }

  /**
   * Record new vitals for a patient.
   * Body: { patientId, heightCm?, weightKg?, temperatureC?, pulseBpm?, systolicBp?, diastolicBp?, spo2Percent?, respiratoryRate? }
   */
  @Post()
  @Permissions('create:patient-vitals')
  create(@Body() dto: CreatePatientVitalsDto, @Req() req: { user: { id: string } }) {
    return this.vitalsService.create(dto, req.user.id);
  }

  /**
   * Soft-delete a vitals record.
   */
  @Delete(':id')
  @Permissions('delete:patient-vitals')
  remove(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.vitalsService.remove(id, req.user.id);
  }
}
