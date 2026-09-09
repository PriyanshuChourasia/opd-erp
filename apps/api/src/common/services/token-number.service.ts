import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export type TokenFormat = 'SEQUENTIAL' | 'PREFIX_SEQUENTIAL' | 'DATE_SEQUENTIAL' | 'DATE_INITIALS_TIME';
export type ResetPolicy = 'DAILY' | 'NEVER' | 'PER_FINANCIAL_YEAR';

interface TokenConfig {
  format: TokenFormat;
  prefix: string;
  padding: number;
  resetPolicy: ResetPolicy;
}

/** Fixed key for a single global Postgres advisory lock (session/transaction
 *  scoped, not tied to any table) that serializes token-number generation.
 *  Arbitrary constant — only needs to be stable and not collide with other
 *  advisory locks this app takes (there are none today). */
const TOKEN_LOCK_KEY = 822991364;

@Injectable()
export class TokenNumberService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate the next token number based on company configuration.
   * Replaces the duplicated generateTokenNumber() in appointments.service.ts and queue.service.ts.
   *
   * MUST be called with the same `tx` (Prisma transaction client) the
   * caller uses to insert the record the token is being generated for, and
   * that insert must happen inside the same transaction. `pg_advisory_xact_lock`
   * serializes concurrent callers so two requests can never read the same
   * "current count" and mint the same token — the lock is released
   * automatically when the transaction commits or rolls back. Calling this
   * outside a transaction (or with a different transaction than the insert)
   * does not protect against duplicates.
   */
  async generateTokenNumber(
    tx: Prisma.TransactionClient,
    patientName: string,
    date: Date = new Date(),
  ): Promise<string> {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${TOKEN_LOCK_KEY})`;

    const company = await tx.company.findFirst();
    const config: TokenConfig = {
      format: (company?.tokenNumberFormat as TokenFormat) ?? 'SEQUENTIAL',
      prefix: company?.tokenNumberPrefix ?? 'TKN',
      padding: company?.tokenNumberPadding ?? 4,
      resetPolicy: (company?.tokenNumberResetPolicy as ResetPolicy) ?? 'DAILY',
    };

    switch (config.format) {
      case 'SEQUENTIAL':
        return this.generateSequential(tx, config, date);
      case 'PREFIX_SEQUENTIAL':
        return this.generatePrefixSequential(tx, config, date);
      case 'DATE_SEQUENTIAL':
        return this.generateDateSequential(tx, config, date);
      case 'DATE_INITIALS_TIME':
        return this.generateDateInitialsTime(patientName, date);
      default:
        return this.generateSequential(tx, config, date);
    }
  }

  private async generateSequential(tx: Prisma.TransactionClient, config: TokenConfig, date: Date): Promise<string> {
    const count = await this.getTokenCount(tx, config.resetPolicy, date);
    return String(count + 1).padStart(config.padding, '0');
  }

  private async generatePrefixSequential(tx: Prisma.TransactionClient, config: TokenConfig, date: Date): Promise<string> {
    const count = await this.getTokenCount(tx, config.resetPolicy, date);
    return `${config.prefix}-${String(count + 1).padStart(config.padding, '0')}`;
  }

  private async generateDateSequential(tx: Prisma.TransactionClient, config: TokenConfig, date: Date): Promise<string> {
    const y = date.getFullYear().toString();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    const dateStr = `${y}${m}${d}`;
    const count = await this.getTokenCount(tx, config.resetPolicy, date);
    return `${dateStr}-${String(count + 1).padStart(config.padding, '0')}`;
  }

  private generateDateInitialsTime(patientName: string, date: Date): string {
    const y = date.getFullYear().toString();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    const h = date.getHours().toString().padStart(2, '0');
    const min = date.getMinutes().toString().padStart(2, '0');
    const nameInitials = patientName
      .split(' ')
      .map((p) => p.charAt(0).toUpperCase())
      .join('')
      .slice(0, 4);
    return `${y}${m}${d}-${nameInitials}-${h}${min}`;
  }

  private async getTokenCount(tx: Prisma.TransactionClient, resetPolicy: ResetPolicy, date: Date): Promise<number> {
    if (resetPolicy === 'NEVER') {
      // Count all appointments ever
      return tx.appointment.count();
    }

    if (resetPolicy === 'DAILY') {
      // Count appointments for this specific day
      const dayStart = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayEnd = new Date(dayStart);
      dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
      return tx.appointment.count({
        where: { createdAt: { gte: dayStart, lt: dayEnd } },
      });
    }

    if (resetPolicy === 'PER_FINANCIAL_YEAR') {
      // Count appointments in the current financial year
      const fy = await tx.financialYear.findFirst({ where: { isCurrent: true } });
      if (!fy) {
        // Fallback: count all appointments
        return tx.appointment.count();
      }
      return tx.appointment.count({
        where: { createdAt: { gte: fy.startDate, lt: fy.endDate } },
      });
    }

    return tx.appointment.count();
  }
}
