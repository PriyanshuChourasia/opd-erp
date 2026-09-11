import { Module } from '@nestjs/common';
import { ApplicationFeaturesService } from './application-features.service';
import { ApplicationFeaturesController } from './application-features.controller';

@Module({
  controllers: [ApplicationFeaturesController],
  providers: [ApplicationFeaturesService],
  exports: [ApplicationFeaturesService],
})
export class ApplicationFeaturesModule {}