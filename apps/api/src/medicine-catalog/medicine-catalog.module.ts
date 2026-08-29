import { Module, OnModuleInit } from '@nestjs/common';
import { MedicineCatalogController } from './medicine-catalog.controller';
import { MedicineCatalogService } from './medicine-catalog.service';
import { ModuleRegistryService } from '../common/services/module-registry.service';
import { registry } from './registry';

@Module({
  controllers: [MedicineCatalogController],
  providers: [MedicineCatalogService],
})
export class MedicineCatalogModule implements OnModuleInit {
  constructor(private readonly registryService: ModuleRegistryService) {}

  onModuleInit() {
    this.registryService.register(registry);
  }
}
