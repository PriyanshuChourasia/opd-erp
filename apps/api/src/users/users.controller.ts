import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() query: FindUsersQueryDto) {
    return this.usersService.findAll(query);
  }
}
