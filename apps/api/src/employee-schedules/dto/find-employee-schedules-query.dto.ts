import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class FindEmployeeSchedulesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  employeeSchedulableType?: string;

  @IsOptional()
  @IsString()
  employeeSchedulableId?: string;

  @IsOptional()
  @IsString()
  shiftId?: string;

  @IsOptional()
  @IsString()
  dayOfWeek?: string;
}
