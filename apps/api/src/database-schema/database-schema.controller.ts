import { Controller, Get, Param, Put, Patch, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { DatabaseSchemaService } from './database-schema.service';
import { SaveSchemaChangesDto } from './dto/save-changes.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('database-schema')
export class DatabaseSchemaController {
  constructor(private readonly schemaService: DatabaseSchemaService) {}

  @Get()
  @Permissions('read:developer')
  findAll() {
    const data = this.schemaService.findAll();
    return { data, total: data.models.length };
  }

  @Get(':model/changes')
  @Permissions('read:developer')
  getChanges(@Param('model') model: string) {
    return this.schemaService.getChanges(model);
  }

  @Put(':model/changes')
  @Permissions('update:developer')
  saveChangesPut(@Param('model') model: string, @Body() body: SaveSchemaChangesDto) {
    return this.schemaService.saveChanges(model, body.changes ?? []);
  }

  @Patch(':model/changes')
  @Permissions('update:developer')
  saveChangesPatch(@Param('model') model: string, @Body() body: SaveSchemaChangesDto) {
    return this.schemaService.saveChanges(model, body.changes ?? []);
  }

  @Get(':model')
  @Permissions('read:developer')
  findModel(@Param('model') model: string) {
    return { data: this.schemaService.findModel(model) };
  }
}
