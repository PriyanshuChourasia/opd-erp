import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { DocumentType } from './create-document.dto';

export class UpdateDocumentDto {
  @IsOptional()
  @IsEnum(DocumentType)
  documentType?: DocumentType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  caption?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
