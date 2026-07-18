import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class FindDocumentsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  documentableType?: string;

  @IsOptional()
  @IsString()
  documentableId?: string;

  @IsOptional()
  @IsString()
  documentType?: string;

  @IsOptional()
  @IsString()
  isPrimary?: string;
}
