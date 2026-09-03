import { PartialType } from '@nestjs/mapped-types';
import { CreateEmployeeScheduleExceptionDto } from './create-employee-schedule-exception.dto';

export class UpdateEmployeeScheduleExceptionDto extends PartialType(
  CreateEmployeeScheduleExceptionDto,
) {}
