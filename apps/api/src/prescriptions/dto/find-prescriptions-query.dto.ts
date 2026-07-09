import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class FindPrescriptionsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  patientId?: string;
}
