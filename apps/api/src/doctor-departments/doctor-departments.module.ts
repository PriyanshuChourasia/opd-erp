import { Module } from '@nestjs/common';
import { DoctorDepartmentsController } from './doctor-departments.controller';
import { DoctorDepartmentsService } from './doctor-departments.service';

@Module({
  controllers: [DoctorDepartmentsController],
  providers: [DoctorDepartmentsService],
})
export class DoctorDepartmentsModule {}
