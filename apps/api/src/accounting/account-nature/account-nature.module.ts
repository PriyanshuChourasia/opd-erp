import { Module } from '@nestjs/common';
import { AccountNatureController } from './account-nature.controller';
import { AccountNatureService } from './account-nature.service';

@Module({
  controllers: [AccountNatureController],
  providers: [AccountNatureService],
  exports: [AccountNatureService],
})
export class AccountNatureModule {}
