import { Module } from '@nestjs/common';
import { StockService } from './stock.service';
import { PurchaseService } from './purchase.service';
import { StockController } from './stock.controller';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [AccountingModule],
  controllers: [StockController],
  providers: [StockService, PurchaseService],
  exports: [StockService],
})
export class StockModule {}
