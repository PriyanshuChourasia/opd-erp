import { Module } from '@nestjs/common';
import { BloodGroupsController } from './blood-groups.controller';
import { BloodGroupsService } from './blood-groups.service';

@Module({
  controllers: [BloodGroupsController],
  providers: [BloodGroupsService],
  exports: [BloodGroupsService],
})
export class BloodGroupsModule {}
