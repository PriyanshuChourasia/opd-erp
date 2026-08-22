import { Module, OnModuleInit } from '@nestjs/common';
import { DiagnosisSystemsController } from './diagnosis-systems.controller';
import { DiagnosisSystemsService } from './diagnosis-systems.service';
import { ModuleRegistryService } from '../common/services/module-registry.service';
import { registry } from './registry';

@Module({
  controllers: [DiagnosisSystemsController],
  providers: [DiagnosisSystemsService],
  exports: [DiagnosisSystemsService],
})
export class DiagnosisSystemsModule implements OnModuleInit {
  constructor(private readonly registryService: ModuleRegistryService) {}

  onModuleInit() {
    this.registryService.register(registry);
  }
}
