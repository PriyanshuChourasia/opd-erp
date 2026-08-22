import { Controller, Get, Param, Put, Patch, Body } from '@nestjs/common';
import { DatabaseSchemaService } from './database-schema.service';
import { SaveSchemaChangesDto } from './dto/save-changes.dto';

@Controller('database-schema')
export class DatabaseSchemaController {
  constructor(private readonly schemaService: DatabaseSchemaService) {}

  @Get()
  findAll() {
    const data = this.schemaService.findAll();
    return { data, total: data.models.length };
  }

  @Get(':model/changes')
  getChanges(@Param('model') model: string) {
    return this.schemaService.getChanges(model);
  }

  @Put(':model/changes')
  saveChangesPut(@Param('model') model: string, @Body() body: SaveSchemaChangesDto) {
    return this.schemaService.saveChanges(model, body.changes ?? []);
  }

  @Patch(':model/changes')
  saveChangesPatch(@Param('model') model: string, @Body() body: SaveSchemaChangesDto) {
    return this.schemaService.saveChanges(model, body.changes ?? []);
  }

  @Get(':model')
  findModel(@Param('model') model: string) {
    return { data: this.schemaService.findModel(model) };
  }
}
