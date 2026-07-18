import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { DoctorsModule } from './doctors/doctors.module';
import { PatientsModule } from './patients/patients.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';
import { MedicineCatalogModule } from './medicine-catalog/medicine-catalog.module';
import { QueueModule } from './queue/queue.module';
import { LabOrdersModule } from './lab-orders/lab-orders.module';
import { RadiologyOrdersModule } from './radiology-orders/radiology-orders.module';
import { ProcedureOrdersModule } from './procedure-orders/procedure-orders.module';
import { BillingModule } from './billing/billing.module';
import { DispensingModule } from './dispensing/dispensing.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UsersModule } from './users/users.module';
import { OrganisationModule } from './organisation/organisation.module';
import { ShiftsModule } from './shifts/shifts.module';
import { AddressesModule } from './addresses/addresses.module';
import { EmployeeSchedulesModule } from './employee-schedules/employee-schedules.module';
import { DocumentsModule } from './documents/documents.module';
import { AllergiesModule } from './allergies/allergies.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CommonModule,
    HealthModule,
    AuthModule,
    DashboardModule,
    DoctorsModule,
    PatientsModule,
    AppointmentsModule,
    PrescriptionsModule,
    MedicineCatalogModule,
    QueueModule,
    LabOrdersModule,
    RadiologyOrdersModule,
    ProcedureOrdersModule,
    BillingModule,
    DispensingModule,
    RolesModule,
    PermissionsModule,
    UsersModule,
    OrganisationModule,
    ShiftsModule,
    AddressesModule,
    EmployeeSchedulesModule,
    DocumentsModule,
    AllergiesModule,
  ],
})
export class AppModule {}
