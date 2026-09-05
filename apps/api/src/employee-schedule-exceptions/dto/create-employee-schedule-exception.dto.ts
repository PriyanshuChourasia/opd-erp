import { IsDateString, IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { EmployeeScheduleExceptionType } from '@prisma/client';

const TIME_FORMAT = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class CreateEmployeeScheduleExceptionDto {
  /** Calendar date in YYYY-MM-DD (normalized to local midnight by the service). */
  @IsDateString()
  date!: string;

  @IsEnum(EmployeeScheduleExceptionType)
  type!: EmployeeScheduleExceptionType;

  @IsString()
  @Matches(TIME_FORMAT, { message: 'startTime must be in HH:mm format' })
  startTime!: string;

  @IsString()
  @Matches(TIME_FORMAT, { message: 'endTime must be in HH:mm format' })
  endTime!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  shiftId?: string;

  // Polymorphic employee fields
  @IsString()
  employeeSchedulableType!: string; // "Doctor" | "Nurse" | ...

  @IsString()
  employeeSchedulableId!: string;
}
