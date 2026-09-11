import { Module } from '@nestjs/common';
import { LicensePlansService } from './license-plans.service';
import { LicensePlansController } from './license-plans.controller';

@Module({
  controllers: [LicensePlansController],
  providers: [LicensePlansService],
  exports: [LicensePlansService],
})
export class LicensePlansModule {}