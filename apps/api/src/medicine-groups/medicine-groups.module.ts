import { Module, OnModuleInit } from '@nestjs/common';
import { MedicineGroupsController } from './medicine-groups.controller';
import { MedicineGroupsService } from './medicine-groups.service';
import { ModuleRegistryService } from '../common/services/module-registry.service';
import { registry } from './registry';

@Module({
  controllers: [MedicineGroupsController],
  providers: [MedicineGroupsService],
})
export class MedicineGroupsModule implements OnModuleInit {
  constructor(private readonly registryService: ModuleRegistryService) {}

  onModuleInit() {
    this.registryService.register(registry);
  }
}
