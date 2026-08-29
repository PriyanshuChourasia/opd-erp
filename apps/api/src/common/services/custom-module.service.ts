import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ModuleRegistryService } from './module-registry.service';
import type { IModuleRegistry } from '../interfaces/module-registry.interface';

/**
 * Persists developer-created module registries in the database and
 * registers them into the in-memory ModuleRegistryService at boot.
 */
@Injectable()
export class CustomModulesService implements OnApplicationBootstrap {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: ModuleRegistryService,
  ) {}

  async onApplicationBootstrap() {
    const rows = await this.prisma.customModule.findMany();
    for (const row of rows) {
      this.registry.register(row.definition as unknown as IModuleRegistry);
    }
    if (rows.length > 0) {
      console.log(`Registered ${rows.length} persisted custom module(s).`);
    }
  }

  async create(definition: IModuleRegistry) {
    const existing = await this.prisma.customModule.findUnique({ where: { id: definition.id } });
    if (existing || this.registry.get(definition.id)) {
      throw new ConflictException(`Module "${definition.id}" already exists`);
    }
    await this.prisma.customModule.create({
      data: { id: definition.id, definition: definition as object },
    });
    this.registry.register(definition);
    return definition;
  }

  async update(id: string, definition: IModuleRegistry) {
    const row = await this.prisma.customModule.findUnique({ where: { id } });
    if (!row) throw new NotFoundException(`Custom module "${id}" not found (built-ins cannot be edited)`);
    if (definition.id !== id) throw new BadRequestException('Module id cannot be changed');
    await this.prisma.customModule.update({
      where: { id },
      data: { definition: definition as object },
    });
    this.registry.register({ ...definition, id });
    return definition;
  }

  async remove(id: string) {
    const row = await this.prisma.customModule.findUnique({ where: { id } });
    if (!row) throw new NotFoundException(`Custom module "${id}" not found (built-ins cannot be deleted)`);
    await this.prisma.customModule.delete({ where: { id } });
    this.registry.unregister(id);
    return { message: `Module ${id} removed` };
  }
}
