import { IsBooleanString, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class FindDiscountsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBooleanString()
  isActive?: string;

  /** When "true", only returns rules usable right now: isActive and within validFrom/validTo. */
  @IsOptional()
  @IsBooleanString()
  activeOnly?: string;
}
