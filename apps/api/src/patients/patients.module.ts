import { Module, OnModuleInit } from '@nestjs/common';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { ModuleRegistryService } from '../common/services/module-registry.service';
import { registry } from './registry';

@Module({
  controllers: [PatientsController],
  providers: [PatientsService],
})
export class PatientsModule implements OnModuleInit {
  constructor(private readonly registryService: ModuleRegistryService) {}

  onModuleInit() {
    this.registryService.register(registry);
  }
}
