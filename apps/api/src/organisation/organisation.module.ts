import { Module, OnModuleInit } from '@nestjs/common';
import { OrganisationController } from './organisation.controller';
import { OrganisationService } from './organisation.service';
import { ModuleRegistryService } from '../common/services/module-registry.service';
import { registry } from './registry';

@Module({
  controllers: [OrganisationController],
  providers: [OrganisationService],
})
export class OrganisationModule implements OnModuleInit {
  constructor(private readonly registryService: ModuleRegistryService) {}

  onModuleInit() {
    this.registryService.register(registry);
  }
}
