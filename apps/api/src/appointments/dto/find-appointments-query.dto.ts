import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class FindAppointmentsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  doctorId?: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  patientId?: string;
}
