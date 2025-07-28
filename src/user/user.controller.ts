import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Request,
  NotFoundException,
  ConflictException,
  UseGuards,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { UserService } from './user.service';
import { FindUserByEmailDto } from './dto/find-user-by-email.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { BackendJwtPayload, RequestWithHeaders } from 'src/lib/types';
import { extractToken } from '../lib/extract-token';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// @ApiBearerAuth('access-token')
// @UseGuards(AuthGuard('jwt'))
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({
    summary: 'Find all users',
  })
  async findAllUsers(): Promise<UserResponseDto[]> {
    const users = await this.userService.findAllUsers();

    if (!users || users.length === 0) {
      throw new NotFoundException('User not found');
    }

    return users;
  }

  @Post()
  @ApiOperation({
    summary: 'Create user',
  })
  async createUser(@Body() userDto: CreateUserDto): Promise<UserResponseDto> {
    try {
      return await this.userService.createUser(userDto);
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email already exists');
      }
      throw error;
    }
  }

  @Get('by-email')
  @ApiOperation({
    summary: 'Find users by email',
  })
  async findByEmail(
    @Query() query: FindUserByEmailDto,
  ): Promise<UserResponseDto> {
    const { email } = query;
    const users: User | null = await this.userService.findByEmail(email);

    if (!users) {
      throw new NotFoundException('USER_NOT_FOUND');
    }

    return users;
  }

  @Get('fuzzy-find-by-email')
  async fuzzyFindUsersByEmail(
    @Query() query: FindUserByEmailDto,
  ): Promise<UserResponseDto[]> {
    const { email } = query;

    const users = await this.userService.fuzzyFindUsersByEmail(email);

    if (!users || users.length === 0) {
      throw new NotFoundException('USER_NOT_FOUND');
    }

    return users;
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({
    summary: 'Get all requests for the authenticated user',
  })
  findRequestsForUser(@Request() req: RequestWithHeaders) {
    const token = extractToken(req);

    try {
      const decoded = jwt.decode(token) as BackendJwtPayload;

      return this.userService.findByEmail(decoded.email ?? '');
    } catch {
      console.error('Request Controller: Error decoding token');
      throw new Error('Invalid token - unable to process');
    }
  }
}
