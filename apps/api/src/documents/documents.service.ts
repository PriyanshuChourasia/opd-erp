import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginate } from '../common/utils/paginate';
import type { IBaseService, IPaginatable } from '../common/interfaces/base-service.interface';
import type { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import type { Document } from '@prisma/client';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { FindDocumentsQueryDto } from './dto/find-documents-query.dto';

/**
 * Manages polymorphic documents (files) for any entity — patient photos,
 * doctor certificates, medical records, etc.
 *
 * Follows the same polymorphic pattern as Address.
 */
@Injectable()
export class DocumentsService
  implements IBaseService<Document, CreateDocumentDto, UpdateDocumentDto>, IPaginatable<Document, FindDocumentsQueryDto>
{
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDocumentDto) {
    // If marking as primary, unset existing primary for the same entity
    if (dto.isPrimary) {
      await this.prisma.document.updateMany({
        where: {
          documentableType: dto.documentableType,
          documentableId: dto.documentableId,
          isPrimary: true,
        },
        data: { isPrimary: false },
      });
    }

    return this.prisma.document.create({ data: dto });
  }

  async findAll(query: FindDocumentsQueryDto): Promise<PaginatedResult<Document>> {
    const where: Record<string, unknown> = {};
    if (query.documentableType) where.documentableType = query.documentableType;
    if (query.documentableId) where.documentableId = query.documentableId;
    if (query.documentType) where.documentType = query.documentType;
    if (query.isPrimary !== undefined) where.isPrimary = query.isPrimary === 'true';

    return paginate(
      () => this.prisma.document.count({ where }),
      ({ skip, take }) =>
        this.prisma.document.findMany({
          where,
          orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }],
          skip,
          take,
        }),
      query,
    );
  }

  /** Find all documents for a given polymorphic entity. */
  async findByEntity(documentableType: string, documentableId: string) {
    return this.prisma.document.findMany({
      where: { documentableType, documentableId, isActive: true },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /** Set a specific document as the primary for its entity (unsets all others). */
  async setPrimary(id: string) {
    const doc = await this.findOne(id);

    await this.prisma.document.updateMany({
      where: {
        documentableType: doc.documentableType,
        documentableId: doc.documentableId,
        isPrimary: true,
      },
      data: { isPrimary: false },
    });

    return this.prisma.document.update({
      where: { id },
      data: { isPrimary: true },
    });
  }

  async findOne(id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException(`Document ${id} not found`);
    return doc;
  }

  async update(id: string, dto: UpdateDocumentDto) {
    await this.findOne(id);

    // If promoting to primary, unset existing primary for the entity
    if (dto.isPrimary) {
      const existing = await this.prisma.document.findUnique({ where: { id } });
      if (existing) {
        await this.prisma.document.updateMany({
          where: {
            documentableType: existing.documentableType,
            documentableId: existing.documentableId,
            isPrimary: true,
            id: { not: id },
          },
          data: { isPrimary: false },
        });
      }
    }

    return this.prisma.document.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const doc = await this.findOne(id);
    // Soft-delete: mark inactive instead of removing the file
    return this.prisma.document.update({ where: { id }, data: { isActive: false } });
  }
}
