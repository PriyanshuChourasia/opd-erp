import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class FindDispensingQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  prescriptionId?: string;
}
