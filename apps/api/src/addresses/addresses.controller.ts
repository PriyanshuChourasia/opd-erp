import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { FindAddressesQueryDto } from './dto/find-addresses-query.dto';

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  @Permissions('create:addresses')
  create(@Body() dto: CreateAddressDto, @Req() req: { user: { id: string } }) {
    return this.addressesService.create(dto, req.user.id);
  }

  @Get()
  @Permissions('read:addresses')
  findAll(@Query() query: FindAddressesQueryDto) {
    return this.addressesService.findAll(query);
  }

  @Get('by-entity')
  @Permissions('read:addresses')
  findByEntity(
    @Query('addressableType') addressableType: string,
    @Query('addressableId') addressableId: string,
  ) {
    return this.addressesService.findByEntity(addressableType, addressableId);
  }

  @Patch(':id/primary')
  @Permissions('update:addresses')
  setPrimary(@Param('id') id: string) {
    return this.addressesService.setPrimary(id);
  }

  @Get(':id')
  @Permissions('read:addresses')
  findOne(@Param('id') id: string) {
    return this.addressesService.findOne(id);
  }

  @Patch(':id')
  @Permissions('update:addresses')
  update(@Param('id') id: string, @Body() dto: UpdateAddressDto, @Req() req: { user: { id: string } }) {
    return this.addressesService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @Permissions('delete:addresses')
  remove(@Param('id') id: string, @Req() req: { user: { id: string } }) {
    return this.addressesService.remove(id, req.user.id);
  }
}
