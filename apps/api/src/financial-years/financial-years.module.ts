import { Module, OnModuleInit } from '@nestjs/common';
import { FinancialYearsController } from './financial-years.controller';
import { FinancialYearsService } from './financial-years.service';
import { ModuleRegistryService } from '../common/services/module-registry.service';
import { registry } from './registry';

@Module({
  controllers: [FinancialYearsController],
  providers: [FinancialYearsService],
})
export class FinancialYearsModule implements OnModuleInit {
  constructor(private readonly registryService: ModuleRegistryService) {}
  onModuleInit() { this.registryService.register(registry); }
}
