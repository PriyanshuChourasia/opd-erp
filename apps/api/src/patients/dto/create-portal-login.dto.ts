import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreatePortalLoginDto {
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
