import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export enum DocumentType {
  PROFILE_PHOTO = 'PROFILE_PHOTO',
  MEDICAL_RECORD = 'MEDICAL_RECORD',
  CERTIFICATE = 'CERTIFICATE',
  PRESCRIPTION = 'PRESCRIPTION',
  LAB_REPORT = 'LAB_REPORT',
  OTHER = 'OTHER',
}

export class CreateDocumentDto {
  @IsEnum(DocumentType)
  documentType!: DocumentType;

  @IsString()
  @MaxLength(255)
  fileName!: string;

  @IsString()
  @MaxLength(255)
  originalName!: string;

  @IsString()
  @MaxLength(100)
  mimeType!: string;

  @IsInt()
  fileSize!: number;

  @IsString()
  filePath!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  caption?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsString()
  documentableType!: string;

  @IsString()
  documentableId!: string;
}
