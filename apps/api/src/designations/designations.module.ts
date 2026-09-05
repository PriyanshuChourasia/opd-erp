import { Module, OnModuleInit } from '@nestjs/common';
import { DesignationsController } from './designations.controller';
import { DesignationsService } from './designations.service';
import { ModuleRegistryService } from '../common/services/module-registry.service';
import { registry } from './registry';

@Module({
  controllers: [DesignationsController],
  providers: [DesignationsService],
})
export class DesignationsModule implements OnModuleInit {
  constructor(private readonly registryService: ModuleRegistryService) {}
  onModuleInit() { this.registryService.register(registry); }
}
