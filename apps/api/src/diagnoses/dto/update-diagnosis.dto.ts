import { PartialType } from '@nestjs/mapped-types';
import { CreateDiagnosisDto } from './create-diagnosis.dto';

export class UpdateDiagnosisDto extends PartialType(CreateDiagnosisDto) {}
