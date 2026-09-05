import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { SearchQueryBuilder } from '../common/services/search-query-builder';
import { paginate } from '../common/utils/paginate';
import type { IBaseService, IPaginatable } from '../common/interfaces/base-service.interface';
import type { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import type { Patient, Prisma } from '@prisma/client';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { FindPatientsQueryDto } from './dto/find-patients-query.dto';
import { AccountingService } from '../accounting/accounting.service';

/**
 * Manages patient registration, search, and profile lifecycle.
 *
 * # SOLID
 * - **Single Responsibility** — only patient CRUD.
 * - **Dependency Inversion** — implements `IBaseService` & `IPaginatable` contracts.
 */
@Injectable()
export class PatientsService
  implements IBaseService<Patient, CreatePatientDto, UpdatePatientDto>, IPaginatable<Patient, FindPatientsQueryDto>
{
  constructor(
    private readonly prisma: PrismaService,
    private readonly accountingService: AccountingService,
  ) {}

  async create(dto: CreatePatientDto, userId?: string) {
    // Generate patientCode: FIRSTNAMELASTNAME-YYMMDD
    const patientCode = await this.generatePatientCode(dto.firstName, dto.lastName, dto.dateOfBirth);

    // Portal credentials created during this registration (only when the
    // patient registered WITH an email and a portal User could be created).
    // Surfaces the raw password to the UI exactly once, like the manual flow.
    let portalLogin: { username: string; email: string; password: string } | null = null;

    const patient = await this.prisma.$transaction(async (tx) => {
      const created = await tx.patient.create({
        data: {
          patientCode,
          firstName: dto.firstName,
          middleName: dto.middleName,
          lastName: dto.lastName,
          contactNo: dto.contactNo,
          altContactNo: dto.altContactNo,
          email: dto.email,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
          gender: dto.gender,
          bloodGroup: dto.bloodGroup,
          address: dto.address,
          emergencyContact: dto.emergencyContact,
          allergies: dto.allergies ?? [],
          isFollowUp: dto.isFollowUp ?? false,
          createdById: userId ?? null,
        },
      });

      // Every patient always gets a Sundry Debtors ledger, even before their first bill.
      await this.accountingService.resolveOrCreatePatientLedger(
        tx,
        created.id,
        `${created.firstName} ${created.lastName}`.trim(),
        userId,
      );

      // Every patient registered with an email gets automatic portal-login
      // access — no separate "Enable Portal Login" step needed. Registration
      // must NEVER fail because of portal setup, so any blocker (missing
      // Patient role, email/username already taken by another User) silently
      // skips portal creation.
      if (dto.email?.trim()) {
        const creds = await this.createPortalUser(tx, created);
        if (creds) {
          portalLogin = { username: creds.username, email: creds.email, password: creds.password };
        }
      }

      return created;
    });

    return { ...patient, portalLogin };
  }

  async findAll(query: FindPatientsQueryDto): Promise<PaginatedResult<Patient & { hasPortalLogin: boolean }>> {
    const where: Record<string, unknown> = { ...SearchQueryBuilder.search(query.search, ['firstName', 'lastName', 'contactNo', 'email', 'patientCode']), deletedAt: null };
    const result = await paginate(
      () => this.prisma.patient.count({ where }),
      ({ skip, take }) => this.prisma.patient.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip, take }),
      query,
    );

    // Batch-attach whether each patient already has a portal login User, so the
    // UI can show the Enable button only where it is actually needed (one query
    // for the page's ids instead of a per-row lookup).
    const ids = result.data.map((p) => p.id);
    const portalUsers = ids.length > 0
      ? await this.prisma.user.findMany({
          where: { userableType: 'Patient', userableId: { in: ids } },
          select: { userableId: true },
        })
      : [];
    const portalSet = new Set(portalUsers.map((u) => u.userableId));
    return { ...result, data: result.data.map((p) => ({ ...p, hasPortalLogin: portalSet.has(p.id) })) };
  }

  async findOne(id: string) {
    const patient = await this.prisma.patient.findFirst({
      where: { id, deletedAt: null },
      include: {
        patientAllergies: {
          include: { allergy: true },
        },
      },
    });
    if (!patient) throw new NotFoundException(`Patient ${id} not found`);
    return patient;
  }

  async update(id: string, dto: UpdatePatientDto, userId?: string) {
    await this.findOne(id);
    return this.prisma.patient.update({
      where: { id },
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        updatedById: userId ?? null,
      },
    });
  }

  async remove(id: string, deletedById?: string) {
    await this.findOne(id);
    return this.prisma.patient.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
        deletedById: deletedById ?? null,
      },
    });
  }

  async restore(id: string) {
    await this.findOne(id);
    return this.prisma.patient.update({ where: { id }, data: { isActive: true } });
  }

  /**
   * Create a portal login User for a patient (Admin/Super-Admin only).
   * Mirrors DoctorsService.createWithUser()'s pattern.
   */
  async createPortalLogin(
    patientId: string,
    dto: { password?: string },
    createdById?: string,
  ) {
    const patient = await this.findOne(patientId);

    // Check if patient already has a linked User
    const existingUser = await this.prisma.user.findFirst({
      where: { userableType: 'Patient', userableId: patientId },
    });
    if (existingUser) {
      throw new ConflictException(`Patient ${patientId} already has a portal login (user: ${existingUser.username})`);
    }

    // Find the Patient role up-front so a missing role stays a clear error in
    // the manual flow (whereas auto-creation during registration skips quietly).
    const patientRole = await this.prisma.role.findFirst({ where: { name: 'Patient' } });
    if (!patientRole) {
      throw new NotFoundException('Patient role not found — run seed first');
    }

    const portal = await this.createPortalUser(this.prisma, patient, dto.password);
    if (!portal) {
      const taken = patient.email
        ? `email ${patient.email}`
        : `username derived from ${patient.patientCode}`;
      throw new ConflictException(`Another user already exists with ${taken} — change the patient's email first`);
    }
    return portal;
  }

  /**
   * Shared portal-User creation used by both the manual "Enable Portal Login"
   * action and automatic creation during patient registration.
   *
   * Portal login id is the patient's EMAIL; the password is the patient's
   * DATE OF BIRTH (DDMMYYYY), falling back to a fixed default when no DOB is
   * on file. A caller-provided password (manual flow) still wins.
   *
   * Returns null (instead of throwing) when creation is not possible: the
   * Patient role is missing or the email/username is already taken by another
   * User — callers decide whether that is a hard error (manual flow) or a
   * quiet skip (registration must never fail because of portal setup).
   */
  private async createPortalUser(
    db: PrismaService | Prisma.TransactionClient,
    patient: Patient,
    rawPassword?: string,
  ): Promise<{ userId: string; username: string; email: string; password: string } | null> {
    const patientRole = await db.role.findFirst({ where: { name: 'Patient' } });
    if (!patientRole) return null;

    // Login id is the patient's email; patients without an email fall back to
    // a code-derived portal address so a login can still exist for them.
    const fallbackUsername = patient.patientCode.toLowerCase().replace(/[^a-z0-9]/g, '');
    const username = patient.email?.trim() || `${fallbackUsername}@portal.local`;
    const email = patient.email ?? `${fallbackUsername}@portal.local`;

    // Password is the date of birth as DDMMYYYY (e.g. 15 Aug 1990 → 15081990).
    const dob = patient.dateOfBirth ? new Date(patient.dateOfBirth) : null;
    const dobPassword = dob
      ? `${String(dob.getDate()).padStart(2, '0')}${String(dob.getMonth() + 1).padStart(2, '0')}${dob.getFullYear()}`
      : 'Patient@123';
    const password = rawPassword ?? dobPassword;

    // User.email and User.username are both unique — skip (never crash) if
    // either is taken by another account.
    const clash = await db.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (clash) return null;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        username,
        firstName: patient.firstName,
        middleName: patient.middleName,
        lastName: patient.lastName,
        email,
        mobileNumber: patient.contactNo,
        password: hashedPassword,
        roleId: patientRole.id,
        userableType: 'Patient',
        userableId: patient.id,
      },
    });

    return {
      userId: user.id,
      username: user.username,
      email: user.email,
      password, // Only returned on creation — the raw password
    };
  }

  /**
   * Generate patientCode in format: FIRSTNAMELASTNAME-YYMMDD
   * If a collision exists, append a suffix (e.g., -01, -02).
   */
  private async generatePatientCode(firstName: string, lastName: string, dateOfBirth?: string): Promise<string> {
    const cleanFirst = firstName.replace(/[^a-zA-Z]/g, '').toUpperCase();
    const cleanLast = lastName.replace(/[^a-zA-Z]/g, '').toUpperCase();
    
    let dateStr = '000000';
    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      const yy = dob.getFullYear().toString().slice(-2);
      const mm = (dob.getMonth() + 1).toString().padStart(2, '0');
      const dd = dob.getDate().toString().padStart(2, '0');
      dateStr = `${yy}${mm}${dd}`;
    }
    
    const baseCode = `${cleanFirst}${cleanLast}-${dateStr}`;
    
    // Check for existing codes with this base
    const existingCount = await this.prisma.patient.count({
      where: { patientCode: { startsWith: baseCode } },
    });
    
    if (existingCount === 0) {
      return baseCode;
    }
    
    // Append suffix to make it unique
    return `${baseCode}-${existingCount.toString().padStart(2, '0')}`;
  }
}
