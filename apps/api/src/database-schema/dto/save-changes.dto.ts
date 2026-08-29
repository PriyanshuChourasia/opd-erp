import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class SchemaChangeDto {
  @IsString()
  fieldName!: string;

  @IsIn(['REMARK', 'REMOVE', 'EDIT', 'ADD'])
  kind!: 'REMARK' | 'REMOVE' | 'EDIT' | 'ADD';

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsString()
  editedName?: string;

  @IsOptional()
  @IsString()
  editedType?: string;

  /** Only used by ADD rows — the type of the newly proposed field. */
  @IsOptional()
  @IsString()
  fieldType?: string;

  /** For ADD rows representing a foreign key: target Prisma model. */
  @IsOptional()
  @IsString()
  targetModel?: string;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsBoolean()
  isList?: boolean;
}

export class SaveSchemaChangesDto {
  @IsArray()
  @ArrayMinSize(0)
  @ValidateNested({ each: true })
  @Type(() => SchemaChangeDto)
  changes!: SchemaChangeDto[];
}
