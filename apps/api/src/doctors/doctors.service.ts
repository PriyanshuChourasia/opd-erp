import { ConflictException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { UpdateDoctorWithUserDto } from './dto/update-doctor-with-user.dto';
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

  async create(dto: CreateDoctorDto, userId?: string) {
    const doctor = await this.prisma.doctor.create({
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
        isActive: dto.isActive ?? true,
        createdById: userId ?? null,
      },
    });

    // Create default weekly schedule (Mon-Fri 9:00-17:00)
    const defaultScheduleDays = [0, 1, 2, 3, 4]; // Monday=0 … Friday=4
    for (const dayOfWeek of defaultScheduleDays) {
      await this.prisma.employeeSchedule.create({
        data: {
          employeeSchedulableType: 'Doctor',
          employeeSchedulableId: doctor.id,
          dayOfWeek,
          startTime: '09:00',
          endTime: '17:00',
        },
      });
    }

    return doctor;
  }

  async findAll(query: FindDoctorsQueryDto): Promise<PaginatedResult<Doctor>> {
    const searchFilter = SearchQueryBuilder.search(query.search, [
      'specialization',
      'medicalRegistrationNo',
      'medicalCouncil',
      { field: 'qualification', mode: 'insensitive' as const },
    ]);

    const where: Record<string, unknown> = { ...searchFilter };

    // Filter by isActive: default to only active doctors, unless explicitly requested
    if (query.isActive !== undefined) {
      where.isActive = query.isActive === 'true';
    } else {
      where.isActive = true;
    }
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

  async update(id: string, dto: UpdateDoctorDto, userId?: string) {
    await this.findOne(id);
    return this.prisma.doctor.update({ where: { id }, data: { ...dto, updatedById: userId ?? null } });
  }



  async findLinkedUser(doctorId: string) {
    const user = await this.prisma.user.findFirst({
      where: { userableType: 'Doctor', userableId: doctorId },
      select: {
        id: true,
        username: true,
        firstName: true,
        middleName: true,
        lastName: true,
        email: true,
        mobileNumber: true,
        gender: true,
        roleId: true,
      },
    });
    if (!user) throw new NotFoundException('Linked user not found for this doctor');
    return user;
  }

  async updateWithUser(id: string, dto: UpdateDoctorWithUserDto) {
    const doctor = await this.findOne(id);

    // Extract user-specific fields
    const {
      firstName,
      lastName,
      middleName,
      email,
      username,
      mobileNumber,
      password,
      addresses: _addressesArray,
      addressType,
      addressLine1,
      addressLine2,
      landmark,
      city,
      district,
      state,
      country,
      postalCode,
      ...doctorFields
    } = dto;

    return this.prisma.$transaction(async (tx) => {
      // 1. Update doctor fields (if any)
      if (Object.keys(doctorFields).length > 0) {
        await tx.doctor.update({ where: { id }, data: doctorFields });
      }

      // 2. Update linked user fields (if any user fields provided)
      const hasUserFields = firstName || lastName || email || username || mobileNumber || password;
      if (hasUserFields) {
        const userData: Record<string, unknown> = {};
        if (firstName) userData.firstName = firstName;
        if (lastName) userData.lastName = lastName;
        if (middleName !== undefined) userData.middleName = middleName;
        if (email) userData.email = email;
        if (username) userData.username = username;
        if (mobileNumber !== undefined) userData.mobileNumber = mobileNumber;
        if (password) userData.password = await bcrypt.hash(password, 10);

        await tx.user.updateMany({
          where: { userableType: 'Doctor', userableId: id },
          data: userData,
        });
      }

      // 3. Handle addresses
      //    If addresses array is provided, replace all addresses for this doctor
      if (_addressesArray && _addressesArray.length > 0) {
        // Delete existing addresses for this doctor
        await tx.address.deleteMany({ where: { addressableType: 'Doctor', addressableId: id } });
        // Create new ones
        for (let i = 0; i < _addressesArray.length; i++) {
          const addr = _addressesArray[i];
          await tx.address.create({
            data: {
              addressType: addr.addressType ?? 'CLINIC',
              addressLine1: addr.addressLine1,
              addressLine2: addr.addressLine2,
              landmark: addr.landmark,
              city: addr.city,
              district: addr.district,
              state: addr.state,
              country: addr.country ?? 'India',
              postalCode: addr.postalCode,
              isPrimary: addr.isPrimary ?? i === 0,
              isActive: true,
              addressableType: 'Doctor',
              addressableId: id,
            },
          });
        }
      } else if (addressLine1) {
        // Legacy: single flat address
        const addressData: Record<string, unknown> = {};
        if (addressLine1) addressData.addressLine1 = addressLine1;
        if (addressLine2 !== undefined) addressData.addressLine2 = addressLine2;
        if (landmark !== undefined) addressData.landmark = landmark;
        if (city) addressData.city = city;
        if (district !== undefined) addressData.district = district;
        if (state) addressData.state = state;
        if (country) addressData.country = country;
        if (postalCode) addressData.postalCode = postalCode;
        if (addressType) addressData.addressType = addressType;

        addressData.isPrimary = true;
        addressData.isActive = true;
        addressData.addressableType = 'Doctor';
        addressData.addressableId = id;

        const existingAddress = await tx.address.findFirst({
          where: { addressableType: 'Doctor', addressableId: id, addressType: addressType ?? 'CLINIC' },
        });

        if (existingAddress) {
          await tx.address.update({ where: { id: existingAddress.id }, data: addressData });
        } else {
          await tx.address.create({ data: addressData as any });
        }
      }

      return this.findOne(id);
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

      // 3. Create Addresses
      //    Priority: dto.addresses array > legacy flat fields > none
      const addressesToCreate: Array<Record<string, unknown>> = [];

      if (dto.addresses && dto.addresses.length > 0) {
        // New: multi-address array
        for (let i = 0; i < dto.addresses.length; i++) {
          const addr = dto.addresses[i];
          addressesToCreate.push({
            addressType: addr.addressType ?? 'CLINIC',
            addressLine1: addr.addressLine1,
            addressLine2: addr.addressLine2,
            landmark: addr.landmark,
            city: addr.city,
            district: addr.district,
            state: addr.state,
            country: addr.country ?? 'India',
            postalCode: addr.postalCode,
            isPrimary: addr.isPrimary ?? i === 0,
            isActive: true,
            addressableType: 'Doctor',
            addressableId: doctor.id,
          });
        }
      } else if (dto.addressLine1) {
        // Legacy: single flat address
        addressesToCreate.push({
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
        });
      }

      const createdAddresses: Array<{ id: string }> = [];
      for (const addrData of addressesToCreate) {
        createdAddresses.push(await tx.address.create({ data: addrData as any }));
      }

      // 4. Create default weekly schedule (Mon-Fri 9:00-17:00)
      const defaultScheduleDays = [0, 1, 2, 3, 4]; // Monday=0 … Friday=4
      for (const dayOfWeek of defaultScheduleDays) {
        await tx.employeeSchedule.create({
          data: {
            employeeSchedulableType: 'Doctor',
            employeeSchedulableId: doctor.id,
            dayOfWeek,
            startTime: '09:00',
            endTime: '17:00',
          },
        });
      }

      return { doctor, user, addresses: createdAddresses };
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
      addresses: result.addresses,
    };
  }

  async remove(id: string) {
    const doctor = await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      // Deactivate the linked user login too
      await tx.user.updateMany({
        where: { userableType: 'Doctor', userableId: id },
        data: { isActive: false },
      });
      return tx.doctor.update({ where: { id }, data: { isActive: false } });
    });
  }

  async restore(id: string) {
    const doctor = await this.prisma.doctor.findUnique({ where: { id } });
    if (!doctor) throw new NotFoundException(`Doctor ${id} not found`);
    return this.prisma.$transaction(async (tx) => {
      // Re-activate the linked user login too
      await tx.user.updateMany({
        where: { userableType: 'Doctor', userableId: id },
        data: { isActive: true },
      });
      return tx.doctor.update({ where: { id }, data: { isActive: true } });
    });
  }
}

export type { DoctorWithUser } from './dto/update-doctor-with-user.dto';
