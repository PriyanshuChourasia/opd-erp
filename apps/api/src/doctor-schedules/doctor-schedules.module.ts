import { Module, OnModuleInit } from '@nestjs/common';
import { DoctorSchedulesController } from './doctor-schedules.controller';
import { DoctorSchedulesService } from './doctor-schedules.service';
import { ModuleRegistryService } from '../common/services/module-registry.service';
import { registry } from './registry';

@Module({
  controllers: [DoctorSchedulesController],
  providers: [DoctorSchedulesService],
})
export class DoctorSchedulesModule implements OnModuleInit {
  constructor(private readonly registryService: ModuleRegistryService) {}

  onModuleInit() {
    this.registryService.register(registry);
  }
}
