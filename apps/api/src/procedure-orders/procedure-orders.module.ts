import { Module, OnModuleInit } from '@nestjs/common';
import { ProcedureOrdersController } from './procedure-orders.controller';
import { ProcedureOrdersService } from './procedure-orders.service';
import { ModuleRegistryService } from '../common/services/module-registry.service';
import { registry } from './registry';

@Module({
  controllers: [ProcedureOrdersController],
  providers: [ProcedureOrdersService],
})
export class ProcedureOrdersModule implements OnModuleInit {
  constructor(private readonly registryService: ModuleRegistryService) {}

  onModuleInit() {
    this.registryService.register(registry);
  }
}
