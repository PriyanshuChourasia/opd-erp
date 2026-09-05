import { PartialType } from '@nestjs/mapped-types';
import { CreateAccountNatureDto } from './create-account-nature.dto';

export class UpdateAccountNatureDto extends PartialType(CreateAccountNatureDto) {}
