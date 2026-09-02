import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { JournalService } from './journal.service';
import { FindJournalsQueryDto } from './dto/find-journals-query.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('accounting/journals')
export class JournalController {
  constructor(private readonly service: JournalService) {}

  @Permissions('read:accounting')
  @Get()
  findAll(@Query() query: FindJournalsQueryDto) {
    return this.service.findAll(query);
  }

  @Permissions('read:accounting')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
