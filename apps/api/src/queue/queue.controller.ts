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
import { QueueService } from './queue.service';
import { CreateQueueEntryDto } from './dto/create-queue-entry.dto';
import { UpdateQueueStatusDto } from './dto/update-queue-status.dto';
import { FindQueueQueryDto } from './dto/find-queue-query.dto';

@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateQueueEntryDto, @Req() req: { user: { id: string } }) {
    return this.queueService.create(dto, req.user.id);
  }

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

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.queueService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateQueueStatusDto, @Req() req: { user: { id: string } }) {
    return this.queueService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.queueService.remove(id);
  }
}
