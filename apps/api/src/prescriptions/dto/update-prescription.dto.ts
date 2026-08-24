import { PartialType } from '@nestjs/mapped-types';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { CreatePrescriptionDto } from './create-prescription.dto';

export class UpdatePrescriptionDto extends PartialType(CreatePrescriptionDto) {
  @IsOptional()
  @IsString()
  @IsIn(['ACTIVE', 'COMPLETED', 'CANCELLED', 'DISCONTINUED'])
  status?: string;
}
