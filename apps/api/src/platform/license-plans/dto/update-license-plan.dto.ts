import { PartialType } from '@nestjs/mapped-types';
import { CreateLicensePlanDto } from './create-license-plan.dto';

export class UpdateLicensePlanDto extends PartialType(CreateLicensePlanDto) {}