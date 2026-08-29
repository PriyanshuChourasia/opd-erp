import { Module, OnModuleInit } from '@nestjs/common';
import { EmployeeSchedulesController } from './employee-schedules.controller';
import { EmployeeSchedulesService } from './employee-schedules.service';
import { CommonModule } from '../common/common.module';
import { ModuleRegistryService } from '../common/services/module-registry.service';
import { registry } from './registry';

@Module({
  imports: [CommonModule],
  controllers: [EmployeeSchedulesController],
  providers: [EmployeeSchedulesService],
})
export class EmployeeSchedulesModule implements OnModuleInit {
  constructor(private readonly registryService: ModuleRegistryService) {}

  onModuleInit() {
    this.registryService.register(registry);
  }
}
