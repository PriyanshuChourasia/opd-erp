import { Module, OnModuleInit } from '@nestjs/common';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';
import { ModuleRegistryService } from '../common/services/module-registry.service';
import { registry } from './registry';

@Module({
  controllers: [DepartmentsController],
  providers: [DepartmentsService],
})
export class DepartmentsModule implements OnModuleInit {
  constructor(private readonly registryService: ModuleRegistryService) {}
  onModuleInit() { this.registryService.register(registry); }
}
