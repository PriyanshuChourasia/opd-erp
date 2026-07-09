import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { QueueService } from './queue.service';
import { CreateQueueEntryDto } from './dto/create-queue-entry.dto';
import { UpdateQueueStatusDto } from './dto/update-queue-status.dto';
import { FindQueueQueryDto } from './dto/find-queue-query.dto';

@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post()
  create(@Body() dto: CreateQueueEntryDto) {
    return this.queueService.create(dto);
  }

  @Get()
  findAll(@Query() query: FindQueueQueryDto) {
    return this.queueService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.queueService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateQueueStatusDto) {
    return this.queueService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.queueService.remove(id);
  }
}
