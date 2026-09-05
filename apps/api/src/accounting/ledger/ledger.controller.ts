import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { LedgerService } from './ledger.service';
import { FindLedgersQueryDto } from './dto/find-ledgers-query.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('accounting/ledgers')
export class LedgerController {
  constructor(private readonly service: LedgerService) {}

  @Permissions('read:accounting')
  @Get()
  findAll(@Query() query: FindLedgersQueryDto) {
    return this.service.findAll(query);
  }

  @Permissions('read:accounting')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
