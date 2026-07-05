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
import { DoctorSchedulesModule } from './doctor-schedules/doctor-schedules.module';
import { QueueModule } from './queue/queue.module';
import { LabOrdersModule } from './lab-orders/lab-orders.module';
import { RadiologyOrdersModule } from './radiology-orders/radiology-orders.module';
import { ProcedureOrdersModule } from './procedure-orders/procedure-orders.module';
import { BillingModule } from './billing/billing.module';
import { DispensingModule } from './dispensing/dispensing.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CommonModule,
    HealthModule,
    AuthModule,
    DoctorsModule,
    PatientsModule,
    AppointmentsModule,
    PrescriptionsModule,
    MedicineCatalogModule,
    DoctorSchedulesModule,
    QueueModule,
    LabOrdersModule,
    RadiologyOrdersModule,
    ProcedureOrdersModule,
    BillingModule,
    DispensingModule,
    RolesModule,
    PermissionsModule,
  ],
})
export class AppModule {}
