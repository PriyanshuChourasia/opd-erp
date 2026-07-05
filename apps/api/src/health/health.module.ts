import { Module, OnModuleInit } from '@nestjs/common';
import { HealthController } from './health.controller';
import { ModuleRegistryService } from '../common/services/module-registry.service';
import { registry } from './registry';

@Module({
  controllers: [HealthController],
})
export class HealthModule implements OnModuleInit {
  constructor(private readonly registryService: ModuleRegistryService) {}

  onModuleInit() {
    this.registryService.register(registry);
  }
}
