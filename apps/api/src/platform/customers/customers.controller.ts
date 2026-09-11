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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { TenantContextGuard } from '../../tenant/tenant-context.guard';
import { RequireScope } from '../../tenant/decorators/require-scope.decorator';
import { TenantScope } from '../../tenant/scope.enum';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
@RequireScope(TenantScope.PLATFORM)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Permissions('create:customers')
  create(@Body() dto: CreateCustomerDto, @Req() req: { user: { id: string } }) {
    return this.customersService.create(dto, req.user.id);
  }

  @Get()
  @Permissions('read:customers')
  findAll(@Query() query: { page?: number; limit?: number; search?: string }) {
    return this.customersService.findAll(query);
  }

  @Get(':id')
  @Permissions('read:customers')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  @Permissions('update:customers')
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto, @Req() req: { user: { id: string } }) {
    return this.customersService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @Permissions('delete:customers')
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}