import { Module, OnModuleInit } from '@nestjs/common';
import { DatabaseOperationsController } from './database-operations.controller';
import { DatabaseOperationsService } from './database-operations.service';
import { ModuleRegistryService } from '../common/services/module-registry.service';
import { registry } from './registry';

@Module({
  controllers: [DatabaseOperationsController],
  providers: [DatabaseOperationsService],
})
export class DatabaseOperationsModule implements OnModuleInit {
  constructor(private readonly registryService: ModuleRegistryService) {}

  onModuleInit() {
    this.registryService.register(registry);
  }
}
