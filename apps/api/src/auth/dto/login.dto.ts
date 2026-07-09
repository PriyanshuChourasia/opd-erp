import { IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsString()
  @MinLength(8)
  password!: string;
}
