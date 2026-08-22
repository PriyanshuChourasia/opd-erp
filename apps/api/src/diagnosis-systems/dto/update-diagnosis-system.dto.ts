import { PartialType } from '@nestjs/mapped-types';
import { CreateDiagnosisSystemDto } from './create-diagnosis-system.dto';

export class UpdateDiagnosisSystemDto extends PartialType(CreateDiagnosisSystemDto) {}
