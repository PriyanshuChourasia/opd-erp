import { IsString } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  resource!: string;

  @IsString()
  action!: string;

  @IsString()
  name!: string;
}
