import { Module, OnModuleInit } from '@nestjs/common';
import { DatabaseSchemaController } from './database-schema.controller';
import { DatabaseSchemaService } from './database-schema.service';
import { ModuleRegistryService } from '../common/services/module-registry.service';
import { registry } from './registry';

@Module({
  controllers: [DatabaseSchemaController],
  providers: [DatabaseSchemaService],
})
export class DatabaseSchemaModule implements OnModuleInit {
  constructor(private readonly registryService: ModuleRegistryService) {}

  onModuleInit() {
    this.registryService.register(registry);
  }
}
