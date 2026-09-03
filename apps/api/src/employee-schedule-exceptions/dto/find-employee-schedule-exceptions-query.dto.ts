import { IsDateString, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class FindEmployeeScheduleExceptionsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  employeeSchedulableType?: string;

  @IsOptional()
  @IsString()
  employeeSchedulableId?: string;

  /** Filter by exception type: EXTRA_SHIFT | OVERRIDE | DAY_OFF */
  @IsOptional()
  @IsString()
  type?: string;

  /** Inclusive lower bound (YYYY-MM-DD). */
  @IsOptional()
  @IsDateString()
  from?: string;

  /** Inclusive upper bound (YYYY-MM-DD). */
  @IsOptional()
  @IsDateString()
  to?: string;
}
