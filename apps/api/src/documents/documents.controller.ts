import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync } from 'fs';
import { randomUUID } from 'crypto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto, DocumentType } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { FindDocumentsQueryDto } from './dto/find-documents-query.dto';

const ALLOWED_MIMES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @Permissions('create:documents')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'documents'),
        filename: (_req, file, cb) => {
          const uniqueName = `${randomUUID()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIMES.includes(file.mimetype)) {
          cb(new BadRequestException(`File type ${file.mimetype} is not allowed`), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body('documentType') documentType: string,
    @Body('documentableType') documentableType: string,
    @Body('documentableId') documentableId: string,
    @Body('caption') caption?: string,
    @Body('isPrimary') isPrimary?: string,
  ) {
    if (!file) throw new BadRequestException('File is required');

    const dto: CreateDocumentDto = {
      documentType: (documentType as DocumentType) || DocumentType.OTHER,
      fileName: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      filePath: file.path,
      caption,
      isPrimary: isPrimary === 'true',
      documentableType,
      documentableId,
    };

    return this.documentsService.create(dto);
  }

  @Get()
  @Permissions('read:documents')
  findAll(@Query() query: FindDocumentsQueryDto) {
    return this.documentsService.findAll(query);
  }

  @Get('by-entity')
  @Permissions('read:documents')
  findByEntity(
    @Query('documentableType') documentableType: string,
    @Query('documentableId') documentableId: string,
  ) {
    return this.documentsService.findByEntity(documentableType, documentableId);
  }

  @Get('batch-profile-photos')
  @Permissions('read:documents')
  findProfilePhotos(
    @Query('documentableType') documentableType: string,
    @Query('ids') ids: string,
  ) {
    const idList = ids.split(',').filter(Boolean);
    return this.documentsService.findProfilePhotosByEntityIds(documentableType, idList);
  }

  @Patch(':id/primary')
  @Permissions('update:documents')
  setPrimary(@Param('id') id: string) {
    return this.documentsService.setPrimary(id);
  }

  @Get(':id/download')
  @Permissions('read:documents')
  async download(@Param('id') id: string, @Res() res: Response) {
    const doc = await this.documentsService.findOne(id);
    const absolutePath = doc.filePath.startsWith('/') ? doc.filePath : join(process.cwd(), doc.filePath.replace(/^\//, ''));
    res.download(absolutePath, doc.originalName);
  }

  /** Serve image inline by ID — works through /api prefix even without /uploads proxy */
  @Get(':id/image')
  async serveImage(@Param('id') id: string, @Res() res: Response) {
    const doc = await this.documentsService.findOne(id);
    const absolutePath = doc.filePath.startsWith('/') ? doc.filePath : join(process.cwd(), doc.filePath.replace(/^\//, ''));
    if (!existsSync(absolutePath)) throw new BadRequestException('File not found');
    res.set({ 'Content-Type': doc.mimeType, 'Cache-Control': 'public, max-age=86400' });
    res.sendFile(absolutePath);
  }

  /** Serve image inline by fileName — for components that only have the fileName */
  @Get('by-name/:fileName/image')
  async serveImageByName(@Param('fileName') fileName: string, @Res() res: Response) {
    const doc = await this.documentsService.findByFileName(fileName);
    const absolutePath = doc.filePath.startsWith('/') ? doc.filePath : join(process.cwd(), doc.filePath.replace(/^\//, ''));
    if (!existsSync(absolutePath)) throw new BadRequestException('File not found');
    res.set({ 'Content-Type': doc.mimeType, 'Cache-Control': 'public, max-age=86400' });
    res.sendFile(absolutePath);
  }

  @Get(':id')
  @Permissions('read:documents')
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('update:documents')
  update(@Param('id') id: string, @Body() dto: UpdateDocumentDto, @Req() req: { user: { id: string } }) {
    return this.documentsService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @Permissions('delete:documents')
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }
}
