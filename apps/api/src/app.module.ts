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
import { CompanyModule } from './company/company.module';
import { ShiftsModule } from './shifts/shifts.module';
import { AddressesModule } from './addresses/addresses.module';
import { EmployeeSchedulesModule } from './employee-schedules/employee-schedules.module';
import { DocumentsModule } from './documents/documents.module';
import { AllergiesModule } from './allergies/allergies.module';
import { DiagnosesModule } from './diagnoses/diagnoses.module';
import { ReportsModule } from './reports/reports.module';
import { PatientVitalsModule } from './patient-vitals/patient-vitals.module';
import { PatientAllergyRecordsModule } from './patient-allergy-records/patient-allergy-records.module';
import { DiagnosisSystemsModule } from './diagnosis-systems/diagnosis-systems.module';
import { DatabaseSchemaModule } from './database-schema/database-schema.module';
import { PrescriptionTemplateModule } from './prescription-template/prescription-template.module';
import { SpecializationsModule } from './specializations/specializations.module';
import { SidebarConfigModule } from './sidebar-config/sidebar-config.module';
import { MedicineGroupsModule } from './medicine-groups/medicine-groups.module';
import { DiscountsModule } from './discounts/discounts.module';
import { UnitsModule } from './units/units.module';
import { DepartmentsModule } from './departments/departments.module';
import { DesignationsModule } from './designations/designations.module';
import { FinancialYearsModule } from './financial-years/financial-years.module';
import { DoctorDepartmentsModule } from './doctor-departments/doctor-departments.module';
import { DoctorSpecializationsModule } from './doctor-specializations/doctor-specializations.module';
import { BloodGroupsModule } from './blood-groups/blood-groups.module';
import { StockModule } from './stock/stock.module';
import { AccountGroupModule } from './accounting/account-group/account-group.module';
import { AccountNatureModule } from './accounting/account-nature/account-nature.module';
import { LedgerModule } from './accounting/ledger/ledger.module';
import { VoucherModule } from './accounting/voucher/voucher.module';
import { JournalModule } from './accounting/journal/journal.module';

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
    CompanyModule,
    ShiftsModule,
    AddressesModule,
    EmployeeSchedulesModule,
    DocumentsModule,
    AllergiesModule,
    DiagnosesModule,
    DiagnosisSystemsModule,
    ReportsModule,
    PatientVitalsModule,
    PatientAllergyRecordsModule,
    DatabaseSchemaModule,
    PrescriptionTemplateModule,
    SpecializationsModule,
    SidebarConfigModule,
    MedicineGroupsModule,
    DiscountsModule,
    UnitsModule,
    DepartmentsModule,
    DesignationsModule,
    FinancialYearsModule,
    DoctorDepartmentsModule,
    DoctorSpecializationsModule,
    BloodGroupsModule,
    StockModule,
    AccountGroupModule,
    AccountNatureModule,
    LedgerModule,
    VoucherModule,
    JournalModule,
  ],
})
export class AppModule {}
