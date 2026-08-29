import { IsOptional, IsString } from 'class-validator';

export class FindBloodGroupsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;
}
