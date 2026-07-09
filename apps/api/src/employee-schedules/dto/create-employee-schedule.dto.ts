import { IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

const TIME_FORMAT = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class CreateEmployeeScheduleDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @IsString()
  @Matches(TIME_FORMAT, { message: 'startTime must be in HH:mm format' })
  startTime!: string;

  @IsString()
  @Matches(TIME_FORMAT, { message: 'endTime must be in HH:mm format' })
  endTime!: string;

  @IsOptional()
  @IsString()
  shiftId?: string;

  // Polymorphic employee fields
  @IsString()
  employeeSchedulableType!: string; // "Doctor" | "Nurse" | "Receptionist" | "Pharmacist" | "LabStaff"

  @IsString()
  employeeSchedulableId!: string;
}
