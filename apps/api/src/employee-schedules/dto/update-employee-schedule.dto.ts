import { PartialType } from '@nestjs/mapped-types';
import { CreateEmployeeScheduleDto } from './create-employee-schedule.dto';

export class UpdateEmployeeScheduleDto extends PartialType(CreateEmployeeScheduleDto) {}
