import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StockService } from './stock.service';
import { PurchaseService } from './purchase.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';

@Controller('stock')
@UseGuards(JwtAuthGuard)
export class StockController {
  constructor(
    private readonly stockService: StockService,
    private readonly purchaseService: PurchaseService,
  ) {}

  @Post('purchase')
  createPurchase(
    @Body() dto: CreatePurchaseDto,
    @Req() req: { user?: { id?: string } },
  ) {
    return this.purchaseService.createPurchase(dto, req.user?.id);
  }

  @Get('summary/:medicineId')
  getStockSummary(@Param('medicineId') medicineId: string) {
    return this.stockService.getStockSummary(medicineId);
  }
}
