import { Module, OnModuleInit } from '@nestjs/common';
import { PatientVitalsController } from './patient-vitals.controller';
import { PatientVitalsService } from './patient-vitals.service';
import { PrismaService } from '../prisma/prisma.service';
import { ModuleRegistryService } from '../common/services/module-registry.service';
import { registry } from './registry';

@Module({
  controllers: [PatientVitalsController],
  providers: [PatientVitalsService, PrismaService],
  exports: [PatientVitalsService],
})
export class PatientVitalsModule implements OnModuleInit {
  constructor(private readonly registryService: ModuleRegistryService) {}

  onModuleInit() {
    this.registryService.register(registry);
  }
}
