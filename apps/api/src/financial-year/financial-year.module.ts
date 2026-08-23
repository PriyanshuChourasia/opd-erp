import { Module, OnModuleInit } from '@nestjs/common';
import { FinancialYearController } from './financial-year.controller';
import { FinancialYearService } from './financial-year.service';
import { ModuleRegistryService } from '../common/services/module-registry.service';
import { registry } from './registry';

@Module({
  controllers: [FinancialYearController],
  providers: [FinancialYearService],
  exports: [FinancialYearService],
})
export class FinancialYearModule implements OnModuleInit {
  constructor(private readonly registryService: ModuleRegistryService) {}

  onModuleInit() {
    this.registryService.register(registry);
  }
}
