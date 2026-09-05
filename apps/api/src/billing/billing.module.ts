import { Module, OnModuleInit } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { ModuleRegistryService } from '../common/services/module-registry.service';
import { registry } from './registry';
import { AccountingModule } from '../accounting/accounting.module';
import { AccountingService } from '../accounting/accounting.service';
import { AccountingBridge } from './accounting-bridge';
import { StockModule } from '../stock/stock.module';
import { StockService } from '../stock/stock.service';

@Module({
  imports: [AccountingModule, StockModule],
  controllers: [BillingController],
  providers: [
    BillingService,
    {
      provide: AccountingBridge,
      useFactory: (accountingService: AccountingService) => new AccountingBridge(accountingService),
      inject: [AccountingService],
    },
  ],
})
export class BillingModule implements OnModuleInit {
  constructor(private readonly registryService: ModuleRegistryService) {}

  onModuleInit() {
    this.registryService.register(registry);
  }
}
