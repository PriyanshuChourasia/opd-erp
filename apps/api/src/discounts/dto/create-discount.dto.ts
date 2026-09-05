import { IsBoolean, IsIn, IsInt, IsISO8601, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateDiscountDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsIn(['PERCENTAGE', 'FLAT'])
  type!: 'PERCENTAGE' | 'FLAT';

  @IsInt()
  @Min(1)
  value!: number;

  @IsOptional()
  @IsISO8601()
  validFrom?: string;

  @IsOptional()
  @IsISO8601()
  validTo?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}
