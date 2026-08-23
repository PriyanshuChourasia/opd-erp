import { Module } from '@nestjs/common';
import { FinancialYearController } from './financial-year.controller';
import { FinancialYearService } from './financial-year.service';

@Module({
  controllers: [FinancialYearController],
  providers: [FinancialYearService],
  exports: [FinancialYearService],
})
export class FinancialYearModule {}
