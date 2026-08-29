import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import type { IModuleRegistry } from '../interfaces/module-registry.interface';

export class UpsertModuleDto {
  @IsString()
  id!: string;

  @IsString()
  name!: string;

  @IsString()
  description!: string;

  @IsString()
  version!: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsString()
  routePrefix?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  /** Full feature tree — validated structurally at the service boundary. */
  @IsOptional()
  @IsArray()
  @Type(() => Object)
  features?: unknown[];
}

export function toRegistry(dto: UpsertModuleDto): IModuleRegistry {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
    version: dto.version,
    author: dto.author,
    routePrefix: dto.routePrefix,
    enabled: dto.enabled ?? true,
    features: (dto.features ?? []) as IModuleRegistry['features'],
  };
}
