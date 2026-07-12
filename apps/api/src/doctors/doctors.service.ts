import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { SearchQueryBuilder } from '../common/services/search-query-builder';
import { paginate } from '../common/utils/paginate';
import { getDoctorNameMap } from '../common/utils/doctor-names';
import type { IBaseService, IPaginatable } from '../common/interfaces/base-service.interface';
import type { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import type { Doctor } from '@prisma/client';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { CreateDoctorWithUserDto } from './dto/create-doctor-with-user.dto';
import { UpdateDoctorDto, UpdateVerificationStatusDto } from './dto/update-doctor.dto';
import { FindDoctorsQueryDto } from './dto/find-doctors-query.dto';

/**
 * Manages doctor profiles, specializations, licenses, and verification workflow.
 *
 * Personal information (name, email, phone) lives on the linked User entity.
 *
 * # SOLID
 * - **Single Responsibility** — only doctor professional data and verification.
 * - **Dependency Inversion** — implements `IBaseService` & `IPaginatable` contracts.
 */
@Injectable()
export class DoctorsService
  implements IBaseService<Doctor, CreateDoctorDto, UpdateDoctorDto>, IPaginatable<Doctor, FindDoctorsQueryDto>
{
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDoctorDto) {
    return this.prisma.doctor.create({
      data: {
        qualification: dto.qualification,
        specialization: dto.specialization,
        medicalRegistrationNo: dto.medicalRegistrationNo,
        medicalCouncil: dto.medicalCouncil,
        registrationYear: dto.registrationYear,
        yearsOfExperience: dto.yearsOfExperience,
        consultationFee: dto.consultationFee ?? 0,
        consultationMode: dto.consultationMode ?? 'OFFLINE',
        signature: dto.signature,
        registrationCertificateUrl: dto.registrationCertificateUrl,
        degreeCertificateUrl: dto.degreeCertificateUrl,
        governmentIdUrl: dto.governmentIdUrl,
        verificationStatus: dto.verificationStatus ?? 'PENDING',
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll(query: FindDoctorsQueryDto): Promise<PaginatedResult<Doctor>> {
    const where = SearchQueryBuilder.search(query.search, [
      'specialization',
      'medicalRegistrationNo',
      'medicalCouncil',
      { field: 'qualification', mode: 'insensitive' as const },
    ]);
    const result = await paginate(
      () => this.prisma.doctor.count({ where }),
      ({ skip, take }) => this.prisma.doctor.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip, take }),
      query,
    );
    const nameMap = await getDoctorNameMap(this.prisma, result.data.map((d) => d.id));
    return { ...result, data: result.data.map((d) => ({ ...d, name: nameMap.get(d.id) ?? null })) };
  }

  async findOne(id: string) {
    const doctor = await this.prisma.doctor.findUnique({ where: { id } });
    if (!doctor) throw new NotFoundException(`Doctor ${id} not found`);
    const nameMap = await getDoctorNameMap(this.prisma, [doctor.id]);
    return { ...doctor, name: nameMap.get(doctor.id) ?? null };
  }

  async update(id: string, dto: UpdateDoctorDto) {
    await this.findOne(id);
    return this.prisma.doctor.update({ where: { id }, data: dto });
  }

  async updateVerificationStatus(id: string, dto: UpdateVerificationStatusDto) {
    const doctor = await this.findOne(id);
    if (doctor.verificationStatus === 'VERIFIED' && dto.verificationStatus !== 'SUSPENDED') {
      throw new Error('Cannot change verification status of a verified doctor');
    }
    return this.prisma.doctor.update({
      where: { id },
      data: { verificationStatus: dto.verificationStatus },
    });
  }

  async createWithUser(dto: CreateDoctorWithUserDto) {
    // Check email uniqueness
    const existingEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingEmail) {
      throw new ConflictException('A user with this email already exists');
    }

    // Check username uniqueness
    const existingUsername = await this.prisma.user.findUnique({ where: { username: dto.username } });
    if (existingUsername) {
      throw new ConflictException('A user with this username already exists');
    }

    // Look up the Doctor role
    const doctorRole = await this.prisma.role.findFirst({ where: { name: 'Doctor' } });
    if (!doctorRole) {
      throw new NotFoundException('Doctor role not found — please seed roles first');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Use a transaction to create all records atomically
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create the Doctor first (we need the ID for the user link)
      const doctor = await tx.doctor.create({
        data: {
          qualification: dto.qualification,
          specialization: dto.specialization,
          medicalRegistrationNo: dto.medicalRegistrationNo,
          medicalCouncil: dto.medicalCouncil,
          registrationYear: dto.registrationYear,
          yearsOfExperience: dto.yearsOfExperience,
          consultationFee: dto.consultationFee ?? 0,
          consultationMode: dto.consultationMode ?? 'OFFLINE',
          signature: dto.signature,
          registrationCertificateUrl: dto.registrationCertificateUrl,
          degreeCertificateUrl: dto.degreeCertificateUrl,
          governmentIdUrl: dto.governmentIdUrl,
          verificationStatus: dto.verificationStatus ?? 'PENDING',
          isActive: true,
        },
      });

      // 2. Create the User linked to the Doctor
      const user = await tx.user.create({
        data: {
          username: dto.username,
          firstName: dto.firstName,
          middleName: dto.middleName,
          lastName: dto.lastName,
          email: dto.email,
          mobileNumber: dto.mobileNumber,
          password: hashedPassword,
          roleId: doctorRole.id,
          userableType: 'Doctor',
          userableId: doctor.id,
        },
        include: {
          role: {
            include: {
              rolePermissions: { include: { permission: true } },
            },
          },
        },
      });

      // 3. Create Address if address fields are provided
      const address = dto.addressLine1
        ? await tx.address.create({
            data: {
              addressType: dto.addressType ?? 'CLINIC',
              addressLine1: dto.addressLine1,
              addressLine2: dto.addressLine2,
              landmark: dto.landmark,
              city: dto.city,
              district: dto.district,
              state: dto.state,
              country: dto.country ?? 'India',
              postalCode: dto.postalCode,
              isPrimary: true,
              isActive: true,
              addressableType: 'Doctor',
              addressableId: doctor.id,
            },
          })
        : null;

      return { doctor, user, address };
    });

    return {
      doctor: result.doctor,
      user: {
        id: result.user.id,
        username: result.user.username,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        email: result.user.email,
        mobileNumber: result.user.mobileNumber,
        roleName: result.user.role.name,
        userableType: 'Doctor',
        userableId: result.doctor.id,
      },
      address: result.address,
    };
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.doctor.delete({ where: { id } });
  }
}
