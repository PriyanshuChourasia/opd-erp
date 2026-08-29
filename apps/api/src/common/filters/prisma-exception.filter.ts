import { ArgumentsHost, Catch, ConflictException, ExceptionFilter, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

/**
 * Catches unhandled Prisma errors (e.g. a unique constraint hit that a service
 * didn't pre-check) and maps them to a proper HTTP response instead of letting
 * them fall through to a raw 500 "Internal server error".
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    switch (exception.code) {
      case 'P2002': {
        const target = exception.meta?.target;
        const fields = Array.isArray(target) ? target.join(', ') : String(target ?? 'value');
        const conflict = new ConflictException(`A record with this ${fields} already exists`);
        return response.status(conflict.getStatus()).json(conflict.getResponse());
      }
      case 'P2025': {
        const notFound = new NotFoundException('Record not found');
        return response.status(notFound.getStatus()).json(notFound.getResponse());
      }
      default: {
        return response.status(500).json({ statusCode: 500, message: 'Internal server error' });
      }
    }
  }
}
