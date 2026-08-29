import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class FindPatientsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;
}
