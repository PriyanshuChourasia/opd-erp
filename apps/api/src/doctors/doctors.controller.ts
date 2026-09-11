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
import { TenantContextGuard } from '../tenant/tenant-context.guard';
import { TenantContextService, AuthUser } from '../tenant/tenant-context.service';
import { RequireScope } from '../tenant/decorators/require-scope.decorator';
import { TenantScope } from '../tenant/scope.enum';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
import { CreateDoctorWithUserDto } from './dto/create-doctor-with-user.dto';
import { UpdateDoctorDto } from './dto/update-doctor.dto';
import { UpdateDoctorWithUserDto } from './dto/update-doctor-with-user.dto';
import { FindDoctorsQueryDto } from './dto/find-doctors-query.dto';

@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
@RequireScope(TenantScope.TENANT)
@Controller('doctors')
export class DoctorsController {
  constructor(
    private readonly doctorsService: DoctorsService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Post()
  @Permissions('create:doctors')
  create(@Body() dto: CreateDoctorDto, @Req() req: { user: AuthUser }) {
    return this.doctorsService.create(dto, req.user.id, this.tenantContext.requireOrganization(req));
  }

  @Post('with-user')
  @Permissions('create:doctors', 'create:users')
  createWithUser(@Body() dto: CreateDoctorWithUserDto) {
    return this.doctorsService.createWithUser(dto);
  }

  @Get()
  @Permissions('read:doctors')
  findAll(@Query() query: FindDoctorsQueryDto, @Req() req: { user: AuthUser }) {
    return this.doctorsService.findAll(query, this.tenantContext.requireOrganization(req));
  }

  @Get(':id')
  @Permissions('read:doctors')
  findOne(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.doctorsService.findOne(id, this.tenantContext.requireOrganization(req));
  }

  @Patch(':id')
  @Permissions('update:doctors')
  update(@Param('id') id: string, @Body() dto: UpdateDoctorDto, @Req() req: { user: AuthUser }) {
    return this.doctorsService.update(id, dto, req.user.id, this.tenantContext.requireOrganization(req));
  }

  @Get(':id/user')
  @Permissions('read:doctors')
  findLinkedUser(@Param('id') id: string) {
    return this.doctorsService.findLinkedUser(id);
  }

  @Patch(':id/with-user')
  @Permissions('update:doctors')
  updateWithUser(@Param('id') id: string, @Body() dto: UpdateDoctorWithUserDto) {
    return this.doctorsService.updateWithUser(id, dto);
  }

  @Patch(':id/restore')
  @Permissions('update:doctors')
  restore(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.doctorsService.restore(id, this.tenantContext.requireOrganization(req));
  }

  @Delete(':id')
  @Permissions('delete:doctors')
  remove(@Param('id') id: string, @Req() req: { user: AuthUser }) {
    return this.doctorsService.remove(id, this.tenantContext.requireOrganization(req));
  }
}
