import { IsOptional, IsString, IsIn } from 'class-validator';

export class CreatePatientAllergyRecordDto {
  @IsString()
  patientId!: string;

  @IsString()
  allergen!: string;

  @IsOptional()
  @IsString()
  @IsIn(['DRUG', 'FOOD', 'ENVIRONMENTAL', 'OTHER'])
  allergyType?: string;

  @IsOptional()
  @IsString()
  reaction?: string;

  @IsOptional()
  @IsString()
  @IsIn(['MILD', 'MODERATE', 'SEVERE', 'LIFE_THREATENING'])
  severity?: string;

  @IsOptional()
  @IsString()
  @IsIn(['ACTIVE', 'INACTIVE', 'RESOLVED'])
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
