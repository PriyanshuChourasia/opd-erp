import { Module, OnModuleInit } from '@nestjs/common';
import { RadiologyOrdersController } from './radiology-orders.controller';
import { RadiologyOrdersService } from './radiology-orders.service';
import { ModuleRegistryService } from '../common/services/module-registry.service';
import { registry } from './registry';

@Module({
  controllers: [RadiologyOrdersController],
  providers: [RadiologyOrdersService],
})
export class RadiologyOrdersModule implements OnModuleInit {
  constructor(private readonly registryService: ModuleRegistryService) {}

  onModuleInit() {
    this.registryService.register(registry);
  }
}
