import { PartialType } from '@nestjs/mapped-types';
import { CreateAccountGroupDto } from './create-account-group.dto';

export class UpdateAccountGroupDto extends PartialType(CreateAccountGroupDto) {}
