import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type TokenFormat = 'SEQUENTIAL' | 'PREFIX_SEQUENTIAL' | 'DATE_SEQUENTIAL' | 'DATE_INITIALS_TIME';
export type ResetPolicy = 'DAILY' | 'NEVER' | 'PER_FINANCIAL_YEAR';

interface TokenConfig {
  format: TokenFormat;
  prefix: string;
  padding: number;
  resetPolicy: ResetPolicy;
}

@Injectable()
export class TokenNumberService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate the next token number based on company configuration.
   * Replaces the duplicated generateTokenNumber() in appointments.service.ts and queue.service.ts.
   */
  async generateTokenNumber(
    patientName: string,
    date: Date = new Date(),
  ): Promise<string> {
    const company = await this.prisma.company.findFirst();
    const config: TokenConfig = {
      format: (company?.tokenNumberFormat as TokenFormat) ?? 'SEQUENTIAL',
      prefix: company?.tokenNumberPrefix ?? 'TKN',
      padding: company?.tokenNumberPadding ?? 4,
      resetPolicy: (company?.tokenNumberResetPolicy as ResetPolicy) ?? 'DAILY',
    };

    switch (config.format) {
      case 'SEQUENTIAL':
        return this.generateSequential(config, date);
      case 'PREFIX_SEQUENTIAL':
        return this.generatePrefixSequential(config, date);
      case 'DATE_SEQUENTIAL':
        return this.generateDateSequential(config, date);
      case 'DATE_INITIALS_TIME':
        return this.generateDateInitialsTime(patientName, date);
      default:
        return this.generateSequential(config, date);
    }
  }

  private async generateSequential(config: TokenConfig, date: Date): Promise<string> {
    const count = await this.getTokenCount(config.resetPolicy, date);
    return String(count + 1).padStart(config.padding, '0');
  }

  private async generatePrefixSequential(config: TokenConfig, date: Date): Promise<string> {
    const count = await this.getTokenCount(config.resetPolicy, date);
    return `${config.prefix}-${String(count + 1).padStart(config.padding, '0')}`;
  }

  private async generateDateSequential(config: TokenConfig, date: Date): Promise<string> {
    const y = date.getFullYear().toString();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    const dateStr = `${y}${m}${d}`;
    const count = await this.getTokenCount(config.resetPolicy, date);
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

  private async getTokenCount(resetPolicy: ResetPolicy, date: Date): Promise<number> {
    if (resetPolicy === 'NEVER') {
      // Count all appointments ever
      return this.prisma.appointment.count();
    }

    if (resetPolicy === 'DAILY') {
      // Count appointments for this specific day
      const dayStart = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayEnd = new Date(dayStart);
      dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
      return this.prisma.appointment.count({
        where: { createdAt: { gte: dayStart, lt: dayEnd } },
      });
    }

    if (resetPolicy === 'PER_FINANCIAL_YEAR') {
      // Count appointments in the current financial year
      const fy = await this.prisma.financialYear.findFirst({ where: { isCurrent: true } });
      if (!fy) {
        // Fallback: count all appointments
        return this.prisma.appointment.count();
      }
      return this.prisma.appointment.count({
        where: { createdAt: { gte: fy.startDate, lt: fy.endDate } },
      });
    }

    return this.prisma.appointment.count();
  }
}
