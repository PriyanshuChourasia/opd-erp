import { Module, OnModuleInit } from '@nestjs/common';
import { SidebarConfigController } from './sidebar-config.controller';
import { SidebarConfigService } from './sidebar-config.service';
import { ModuleRegistryService } from '../common/services/module-registry.service';
import { registry } from './registry';

@Module({
  controllers: [SidebarConfigController],
  providers: [SidebarConfigService],
})
export class SidebarConfigModule implements OnModuleInit {
  constructor(private readonly registryService: ModuleRegistryService) {}

  onModuleInit() {
    this.registryService.register(registry);
  }
}
