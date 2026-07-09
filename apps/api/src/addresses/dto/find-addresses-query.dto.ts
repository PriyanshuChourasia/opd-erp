import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class FindAddressesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  addressableType?: string;

  @IsOptional()
  @IsString()
  addressableId?: string;

  @IsOptional()
  @IsString()
  addressType?: string;

  @IsOptional()
  @IsString()
  isPrimary?: string;
}
