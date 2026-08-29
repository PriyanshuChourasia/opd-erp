import { Controller, Get, Param, Query } from '@nestjs/common';
import { BloodGroupsService } from './blood-groups.service';
import { FindBloodGroupsQueryDto } from './dto/find-blood-groups-query.dto';

@Controller('blood-groups')
export class BloodGroupsController {
  constructor(private readonly service: BloodGroupsService) {}

  @Get()
  findAll(@Query() query: FindBloodGroupsQueryDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
