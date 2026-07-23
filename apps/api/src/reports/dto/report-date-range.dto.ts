import { IsDateString, IsNumberString, IsOptional, IsString, Min } from 'class-validator';

/**
 * Shared query DTO for aggregate reports (charts / summaries).
 * Extend this with report-specific fields as needed.
 */
export class ReportDateRangeDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  doctorId?: string;
}

/**
 * For reports that return a paginated list.
 */
export class ReportPaginationDto extends ReportDateRangeDto {
  @IsOptional()
  @IsNumberString()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumberString()
  @Min(1)
  limit?: number = 100;
}
