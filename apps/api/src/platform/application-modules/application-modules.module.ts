import { Module } from '@nestjs/common';
import { ApplicationModulesService } from './application-modules.service';
import { ApplicationModulesController } from './application-modules.controller';

@Module({
  controllers: [ApplicationModulesController],
  providers: [ApplicationModulesService],
  exports: [ApplicationModulesService],
})
export class ApplicationModulesModule {}