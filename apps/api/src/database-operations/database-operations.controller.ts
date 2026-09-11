import {
  Controller, Get, Param, Query, UseGuards, Res, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantContextGuard } from '../tenant/tenant-context.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { DatabaseOperationsService } from './database-operations.service';

@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
@Controller('database-operations')
export class DatabaseOperationsController {
  constructor(private readonly service: DatabaseOperationsService) {}

  @Get('tables')
  @Permissions('read:database-operations')
  getTables() {
    return { data: this.service.getTables() };
  }

  @Get('tables/:model/backup')
  @Permissions('read:database-operations')
  async backupTable(@Param('model') model: string, @Res() res: Response) {
    const { filename, rows } = await this.service.backupTable(model);
    this.sendJson(res, filename, rows);
  }

  @Get('tables/:model/records/:id/backup')
  @Permissions('read:database-operations')
  async backupDocument(@Param('model') model: string, @Param('id') id: string, @Res() res: Response) {
    try {
      const { filename, row } = await this.service.backupDocument(model, id);
      this.sendJson(res, filename, row);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw error;
    }
  }

  @Get('snapshot/full')
  @Permissions('read:database-operations')
  async fullSnapshot(@Res() res: Response) {
    const { filename, tempPath } = await this.service.fullSnapshot();
    res.download(tempPath, filename, (err) => {
      if (err) {
        console.error('[database-operations] download error:', err);
      }
      fsUnlink(tempPath).catch(() => {});
    });
  }

  @Get('snapshot/range')
  @Permissions('read:database-operations')
  async rangeSnapshot(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('table') table: string | undefined,
    @Res() res: Response,
  ) {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate query params are required');
    }
    const { filename, payload } = await this.service.rangeSnapshot(startDate, endDate, table);
    this.sendJson(res, filename, payload);
  }

  private sendJson(res: Response, filename: string, payload: unknown) {
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(payload, null, 2));
  }
}

import * as fs from 'fs';
import { promisify } from 'util';

const fsUnlink = promisify(fs.unlink);
