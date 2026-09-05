import { PartialType } from '@nestjs/mapped-types';
import { CreateDesignationDto } from './create-designation.dto';

export class UpdateDesignationDto extends PartialType(CreateDesignationDto) {}
