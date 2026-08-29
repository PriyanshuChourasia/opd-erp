import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { SchemaChangeDto } from './dto/save-changes.dto';

export interface SchemaField {
  name: string;
  type: string;
  kind: 'scalar' | 'object' | 'enum' | 'unsupported';
  isRequired: boolean;
  isList: boolean;
  isId: boolean;
  isUnique: boolean;
  hasDefault: boolean;
  isUpdatedAt: boolean;
  /** For relations: FK columns on THIS model ([] = back-relation, FK lives on the other side). */
  relationFromFields: string[];
  /** For relations: the referenced columns on the other model (usually ["id"]). */
  relationToFields: string[];
}

export interface SchemaModel {
  name: string;
  fields: SchemaField[];
  relations: string[];
  uniqueFields: string[][];
}

export interface SchemaEnum {
  name: string;
  values: string[];
}

export interface DatabaseSchema {
  models: SchemaModel[];
  enums: SchemaEnum[];
}

/**
 * Exposes the Prisma data model (DMMF) over HTTP so developer tooling
 * can introspect models, fields, relations, and enums without direct
 * database access.
 */
@Injectable()
export class DatabaseSchemaService {
  private readonly schema: DatabaseSchema;

  constructor(private readonly prisma: PrismaService) {
    const { models, enums } = Prisma.dmmf.datamodel;

    this.schema = {
      models: models.map((model) => ({
        name: model.name,
        fields: model.fields.map((field) => ({
          name: field.name,
          type: field.type,
          kind: field.kind,
          isRequired: field.isRequired,
          isList: field.isList,
          isId: field.isId,
          isUnique:
            model.uniqueFields.length === 1 && model.uniqueFields[0].length === 1
              ? model.uniqueFields[0][0] === field.name
              : false,
          hasDefault: field.hasDefaultValue,
          isUpdatedAt: field.isUpdatedAt ?? false,
          relationFromFields: [...(field.relationFromFields ?? [])],
          relationToFields: [...(field.relationToFields ?? [])],
        })),
        relations: model.fields
          .filter((field) => field.kind === 'object')
          .map((field) => field.name),
        uniqueFields: model.uniqueFields.map((fields) => [...fields]),
      })),
      enums: enums.map((enumeration) => ({
        name: enumeration.name,
        values: enumeration.values.map((value) => value.name),
      })),
    };
  }

  findAll(): DatabaseSchema {
    return this.schema;
  }

  findModel(name: string): SchemaModel {
    const model = this.schema.models.find((m) => m.name.toLowerCase() === name.toLowerCase());
    if (!model) throw new NotFoundException(`Model ${name} not found`);
    return model;
  }

  /**
   * Saved change-plan annotations for one model (remarks, edit marks,
   * removal marks, and proposed fields). Everything the developer captures
   * in the Schema viewer is persisted here — nothing lives client-side only.
   */
  async getChanges(modelName: string) {
    const data = await this.prisma.schemaFieldChange.findMany({
      where: { modelName },
      orderBy: [{ fieldName: 'asc' }, { kind: 'asc' }],
    });
    return { data };
  }

  /** Replace the full change plan for a model in one transactional sync. */
  async saveChanges(modelName: string, changes: SchemaChangeDto[]) {
    await this.prisma.$transaction([
      this.prisma.schemaFieldChange.deleteMany({ where: { modelName } }),
      this.prisma.schemaFieldChange.createMany({
        data: changes.map((change) => ({
          modelName,
          fieldName: change.fieldName,
          kind: change.kind,
          remark: change.remark,
          editedName: change.editedName,
          editedType: change.editedType,
          fieldType: change.fieldType,
          targetModel: change.targetModel,
          isRequired: change.isRequired ?? true,
          isList: change.isList ?? false,
        })),
      }),
    ]);
    return this.getChanges(modelName);
  }
}
