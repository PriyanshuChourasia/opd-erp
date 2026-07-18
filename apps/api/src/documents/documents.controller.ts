import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
import { randomUUID } from 'crypto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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

@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
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
  findAll(@Query() query: FindDocumentsQueryDto) {
    return this.documentsService.findAll(query);
  }

  @Get('by-entity')
  findByEntity(
    @Query('documentableType') documentableType: string,
    @Query('documentableId') documentableId: string,
  ) {
    return this.documentsService.findByEntity(documentableType, documentableId);
  }

  @Patch(':id/primary')
  setPrimary(@Param('id') id: string) {
    return this.documentsService.setPrimary(id);
  }

  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: Response) {
    const doc = await this.documentsService.findOne(id);
    res.download(doc.filePath, doc.originalName);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDocumentDto) {
    return this.documentsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }
}
