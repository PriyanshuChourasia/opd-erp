import { Module } from '@nestjs/common';
import { DoctorSpecializationsController } from './doctor-specializations.controller';
import { DoctorSpecializationsService } from './doctor-specializations.service';

@Module({
  controllers: [DoctorSpecializationsController],
  providers: [DoctorSpecializationsService],
})
export class DoctorSpecializationsModule {}
