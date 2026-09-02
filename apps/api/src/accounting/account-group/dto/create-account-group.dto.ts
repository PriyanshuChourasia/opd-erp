import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAccountGroupDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsString()
  @MinLength(1)
  natureId!: string;

  @IsOptional()
  @IsString()
  parentGroupId?: string;

  @IsOptional()
  @IsBoolean()
  isReserved?: boolean;

  @IsOptional()
  @IsBoolean()
  affectsGrossProfit?: boolean;
}
