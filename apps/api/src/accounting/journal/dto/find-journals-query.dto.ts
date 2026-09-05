import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class FindJournalsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  journalTypeId?: string;

  @IsOptional()
  @IsString()
  voucherId?: string;

  @IsOptional()
  @IsString()
  isPosted?: string;
}
