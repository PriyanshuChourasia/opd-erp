import { Module, OnModuleInit } from '@nestjs/common';
import { DispensingController } from './dispensing.controller';
import { DispensingService } from './dispensing.service';
import { ModuleRegistryService } from '../common/services/module-registry.service';
import { registry } from './registry';

@Module({
  controllers: [DispensingController],
  providers: [DispensingService],
})
export class DispensingModule implements OnModuleInit {
  constructor(private readonly registryService: ModuleRegistryService) {}

  onModuleInit() {
    this.registryService.register(registry);
  }
}
