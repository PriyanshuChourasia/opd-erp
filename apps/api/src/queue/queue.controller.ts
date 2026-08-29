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
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { QueueService } from './queue.service';
import { CreateQueueEntryDto } from './dto/create-queue-entry.dto';
import { UpdateQueueStatusDto } from './dto/update-queue-status.dto';
import { FindQueueQueryDto } from './dto/find-queue-query.dto';

@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('create:queue')
  @Post()
  create(@Body() dto: CreateQueueEntryDto, @Req() req: { user: { id: string } }) {
    return this.queueService.create(dto, req.user.id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('read:queue')
  @Get()
  findAll(@Query() query: FindQueueQueryDto) {
    return this.queueService.findAll(query);
  }

  // Public, unauthenticated, minimal-data feed for a waiting-room display screen —
  // no patient names/phones, just token/status/doctor. Must stay above ':id'.
  @Get('display')
  findDisplay() {
    return this.queueService.findDisplay();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('read:queue')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.queueService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('update:queue')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateQueueStatusDto, @Req() req: { user: { id: string } }) {
    return this.queueService.update(id, dto, req.user.id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('delete:queue')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.queueService.remove(id);
  }
}
