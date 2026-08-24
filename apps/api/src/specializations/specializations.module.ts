import { Module, OnModuleInit } from '@nestjs/common';
import { SpecializationsController } from './specializations.controller';
import { SpecializationsService } from './specializations.service';
import { ModuleRegistryService } from '../common/services/module-registry.service';
import { registry } from './registry';

@Module({
  controllers: [SpecializationsController],
  providers: [SpecializationsService],
})
export class SpecializationsModule implements OnModuleInit {
  constructor(private readonly registryService: ModuleRegistryService) {}

  onModuleInit() {
    this.registryService.register(registry);
  }
}
