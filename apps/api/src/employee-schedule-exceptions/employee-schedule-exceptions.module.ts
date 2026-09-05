import { Module } from '@nestjs/common';
import { EmployeeScheduleExceptionsController } from './employee-schedule-exceptions.controller';
import { EmployeeScheduleExceptionsService } from './employee-schedule-exceptions.service';

@Module({
  controllers: [EmployeeScheduleExceptionsController],
  providers: [EmployeeScheduleExceptionsService],
})
export class EmployeeScheduleExceptionsModule {}
