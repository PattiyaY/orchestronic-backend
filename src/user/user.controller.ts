import { Controller, Post, Body } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  createUser(@Body() user: Prisma.UserCreateInput) {
    return this.userService.createUser(user);
  }
}
