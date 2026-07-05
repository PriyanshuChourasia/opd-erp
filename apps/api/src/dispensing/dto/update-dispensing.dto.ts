import { PartialType } from '@nestjs/mapped-types';
import { CreateDispensingDto } from './create-dispensing.dto';

export class UpdateDispensingDto extends PartialType(CreateDispensingDto) {}
