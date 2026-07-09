import { IsBoolean, IsOptional, IsString, Matches, MinLength } from 'class-validator';

const TIME_FORMAT = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class CreateShiftDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(1)
  code!: string;

  @IsString()
  @Matches(TIME_FORMAT, { message: 'startTime must be in HH:mm format' })
  startTime!: string;

  @IsString()
  @Matches(TIME_FORMAT, { message: 'endTime must be in HH:mm format' })
  endTime!: string;

  @IsOptional()
  @IsString()
  @Matches(TIME_FORMAT, { message: 'breakStartTime must be in HH:mm format' })
  breakStartTime?: string;

  @IsOptional()
  @IsString()
  @Matches(TIME_FORMAT, { message: 'breakEndTime must be in HH:mm format' })
  breakEndTime?: string;

  @IsOptional()
  @IsBoolean()
  isOvernight?: boolean;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
