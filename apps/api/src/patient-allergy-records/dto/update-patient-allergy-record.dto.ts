import { PartialType } from '@nestjs/mapped-types';
import { CreatePatientAllergyRecordDto } from './create-patient-allergy-record.dto';

export class UpdatePatientAllergyRecordDto extends PartialType(CreatePatientAllergyRecordDto) {}
