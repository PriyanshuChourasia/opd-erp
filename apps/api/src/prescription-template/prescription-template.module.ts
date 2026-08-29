import { Module, OnModuleInit } from '@nestjs/common';
import { PrescriptionTemplateController } from './prescription-template.controller';
import { PrescriptionTemplateService } from './prescription-template.service';
import { ModuleRegistryService } from '../common/services/module-registry.service';
import { registry } from './registry';

@Module({
  controllers: [PrescriptionTemplateController],
  providers: [PrescriptionTemplateService],
  exports: [PrescriptionTemplateService],
})
export class PrescriptionTemplateModule implements OnModuleInit {
  constructor(private readonly registryService: ModuleRegistryService) {}

  onModuleInit() {
    this.registryService.register(registry);
  }
}
