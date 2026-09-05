import { IsEnum, IsString, MinLength } from 'class-validator';

export class CreateAccountNatureDto {
  @IsString()
  @MinLength(1)
  code!: string;

  @IsString()
  @MinLength(1)
  name!: string;

  @IsEnum(['DEBIT', 'CREDIT'] as const)
  normalBalance!: 'DEBIT' | 'CREDIT';
}
