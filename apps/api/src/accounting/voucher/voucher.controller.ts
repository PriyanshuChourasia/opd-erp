import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { VoucherService } from './voucher.service';
import { FindVouchersQueryDto } from './dto/find-vouchers-query.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('accounting/vouchers')
export class VoucherController {
  constructor(private readonly service: VoucherService) {}

  @Permissions('read:accounting')
  @Get()
  findAll(@Query() query: FindVouchersQueryDto) {
    return this.service.findAll(query);
  }

  @Permissions('read:accounting')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
