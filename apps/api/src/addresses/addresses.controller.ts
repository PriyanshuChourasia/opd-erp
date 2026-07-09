import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { FindAddressesQueryDto } from './dto/find-addresses-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  create(@Body() dto: CreateAddressDto) {
    return this.addressesService.create(dto);
  }

  @Get()
  findAll(@Query() query: FindAddressesQueryDto) {
    return this.addressesService.findAll(query);
  }

  @Get('by-entity')
  findByEntity(
    @Query('addressableType') addressableType: string,
    @Query('addressableId') addressableId: string,
  ) {
    return this.addressesService.findByEntity(addressableType, addressableId);
  }

  @Patch(':id/primary')
  setPrimary(@Param('id') id: string) {
    return this.addressesService.setPrimary(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.addressesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAddressDto) {
    return this.addressesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.addressesService.remove(id);
  }
}
