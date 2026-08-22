import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PatientAllergyRecordsService } from './patient-allergy-records.service';
import { CreatePatientAllergyRecordDto } from './dto/create-patient-allergy-record.dto';
import { UpdatePatientAllergyRecordDto } from './dto/update-patient-allergy-record.dto';

/**
 * Patient allergy records — tracks what a patient is allergic to.
 * Full CRUD: create, read, update, soft-delete.
 */
@UseGuards(JwtAuthGuard)
@Controller('patient-allergy-records')
export class PatientAllergyRecordsController {
  constructor(private readonly allergyRecordsService: PatientAllergyRecordsService) {}

  /**
   * Create a new allergy record for a patient.
   */
  @Post()
  create(@Body() dto: CreatePatientAllergyRecordDto, @Req() req: { user: { id: string } }) {
    return this.allergyRecordsService.create(dto, req.user.id);
  }

  /**
   * Get all allergy records for a patient.
   * Query params: patientId (required), status?, page?, limit?
   */
  @Get()
  findAll(
    @Query('patientId') patientId: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.allergyRecordsService.findByPatient(patientId, {
      status,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }

  /**
   * Get a single allergy record by ID.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.allergyRecordsService.findOne(id);
  }

  /**
   * Update an allergy record (e.g., change status, update reaction notes).
   */
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePatientAllergyRecordDto,
    @Req() req: { user: { id: string } },
  ) {
    return this.allergyRecordsService.update(id, dto, req.user.id);
  }

  /**
   * Soft-delete an allergy record (sets status to INACTIVE).
   */
  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.allergyRecordsService.remove(id, req.user.id);
  }

  /**
   * Get severe/life-threatening allergies for a patient (critical alerts).
   */
  @Get('severe/:patientId')
  getSevereAllergies(@Param('patientId') patientId: string) {
    return this.allergyRecordsService.getSevereAllergies(patientId);
  }
}
