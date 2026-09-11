import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as childProcess from 'child_process';
import * as crypto from 'crypto';

const EXCLUDED_MODELS = new Set(['RolePermission', 'RoleSidebarMenu']);

@Injectable()
export class DatabaseOperationsService {
  private readonly prisma: PrismaClient;
  private readonly backupableModels: string[];

  constructor(private readonly prismaService: PrismaService) {
    this.prisma = this.prismaService;
    const models = Prisma.dmmf.datamodel.models.map((m) => m.name);
    this.backupableModels = models.filter((name) => !EXCLUDED_MODELS.has(name));
  }

  getTables(): string[] {
    return [...this.backupableModels];
  }

  private accessor(modelName: string): PrismaclientModel {
    const key = modelName.charAt(0).toLowerCase() + modelName.slice(1);
    return (this.prisma as any)[key];
  }

  async backupTable(model: string): Promise<{ filename: string; rows: unknown[] }> {
    if (!this.backupableModels.includes(model)) {
      throw new NotFoundException(`Model ${model} is not backupable`);
    }
    const accessor = this.accessor(model);
    const rows = await accessor.findMany();
    return { filename: this.tableFilename(model), rows };
  }

  async backupDocument(model: string, id: string): Promise<{ filename: string; row: unknown }> {
    if (!this.backupableModels.includes(model)) {
      throw new NotFoundException(`Model ${model} is not backupable`);
    }
    const accessor = this.accessor(model);
    const row = await accessor.findUnique({ where: { id } });
    if (row === null) {
      throw new NotFoundException(`${model} record with id ${id} not found`);
    }
    return { filename: this.documentFilename(model, id), row };
  }

  async fullSnapshot(): Promise<{ filename: string; tempPath: string }> {
    const dbUrl = this.stripSchemaSuffix(process.env.DATABASE_URL);
    if (!dbUrl) {
      throw new BadRequestException('DATABASE_URL is not configured');
    }
    const dbName = this.extractDbName(dbUrl);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${dbName}_full_${timestamp}.dump`;
    const tempPath = path.join(os.tmpdir(), filename);
    await this.runPgDump(dbUrl, tempPath);
    return { filename, tempPath };
  }

  async rangeSnapshot(startDate: string, endDate: string, table?: string): Promise<{ filename: string; payload: unknown }> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('startDate and endDate must be valid ISO dates');
    }
    if (start > end) {
      throw new BadRequestException('startDate must be on or before endDate');
    }

    const targetModels = table
      ? [table].filter((t) => this.backupableModels.includes(t))
      : this.backupableModels;

    if (table && targetModels.length === 0) {
      throw new NotFoundException(`Model ${table} is not backupable`);
    }

    const result: Record<string, unknown> = {};
    for (const model of targetModels) {
      const accessor = this.accessor(model);
      const rows = await accessor.findMany({
        where: { createdAt: { gte: start, lte: end } },
      });
      result[model] = rows;
    }

    const payload = table ? (result[table] as unknown[]) : result;
    const filename = this.rangeFilename(table, startDate, endDate);
    return { filename, payload };
  }

  // ─── helpers ────────────────────────────────────────────────────────

  private stripSchemaSuffix(databaseUrl: string | undefined): string {
    if (!databaseUrl) return '';
    const idx = databaseUrl.indexOf('?');
    return idx === -1 ? databaseUrl : databaseUrl.slice(0, idx);
  }

  private extractDbName(databaseUrl: string): string {
    // e.g. postgresql://user:pass@host:5432/dbname → dbname
    const m = databaseUrl.match(/\/([^\/]+?)$/);
    return m ? m[1] : 'database';
  }

  private tableFilename(model: string): string {
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    return `${model}_${ts}.json`;
  }

  private documentFilename(model: string, id: string): string {
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    return `${model}_${id}_${ts}.json`;
  }

  private rangeFilename(table: string | undefined, startDate: string, endDate: string): string {
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const label = table ?? `range_${startDate}_to_${endDate}`;
    return `snapshot_${label}_${ts}.json`;
  }

  private runPgDump(dbUrl: string, tempPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Mirror docker-entrypoint.sh: strip ?schema=... before calling pg_dump
      const args = ['-Fc', '-f', tempPath, dbUrl];
      const proc = childProcess.spawn('pg_dump', args, { stdio: ['ignore', 'pipe', 'pipe'] });
      let stderr = '';
      proc.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
      proc.on('close', (code) => {
        if (code === 0) return resolve();
        reject(new Error(`pg_dump exited with code ${code}: ${stderr.trim()}`));
      });
      proc.on('error', (err) => reject(new Error(`Failed to spawn pg_dump: ${err.message}`)));
    });
  }
}

type PrismaclientModel = { findMany(opts?: any): Promise<any[]>; findUnique(opts?: any): Promise<any> };
