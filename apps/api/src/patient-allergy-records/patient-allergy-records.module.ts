import { Module, OnModuleInit } from '@nestjs/common';
import { PatientAllergyRecordsController } from './patient-allergy-records.controller';
import { PatientAllergyRecordsService } from './patient-allergy-records.service';
import { PrismaService } from '../prisma/prisma.service';
import { ModuleRegistryService } from '../common/services/module-registry.service';
import { registry } from './registry';

@Module({
  controllers: [PatientAllergyRecordsController],
  providers: [PatientAllergyRecordsService, PrismaService],
  exports: [PatientAllergyRecordsService],
})
export class PatientAllergyRecordsModule implements OnModuleInit {
  constructor(private readonly registryService: ModuleRegistryService) {}

  onModuleInit() {
    this.registryService.register(registry);
  }
}
