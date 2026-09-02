import { Module } from '@nestjs/common';
import { AccountingService } from './accounting.service';

@Module({
  providers: [AccountingService],
  exports: [AccountingService],
})
export class AccountingModule {}
