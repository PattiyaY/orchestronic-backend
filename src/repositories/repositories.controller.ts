import { Controller, UseGuards } from '@nestjs/common';
import { Get, Query, Post, Body, Request } from '@nestjs/common';
import { RepositoriesService } from './repositories.service';
import { CreateRepositoriesDto } from './dto/create-repository.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CustomJWTPayload, RequestWithHeaders } from 'src/lib/types';
import * as jwt from 'jsonwebtoken';

@Controller('repositories')
export class RepositoriesController {
  constructor(private readonly repositoriesService: RepositoriesService) {}

  @Get('available-repository')
  findByName(@Query('name') name: string) {
    return this.repositoriesService.findByName(name);
  }
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Post()
  createRepository(@Body() repository: CreateRepositoriesDto) {
    return this.repositoriesService.createRepository(repository);
  }
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll(@Request() req: RequestWithHeaders) {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Authorization header missing or malformed');
    }
    const token = authHeader.split(' ')[1];

    try {
      console.log('Request Controller: Decoding token...');
      // Decode the token without verification to get payload
      const decoded = jwt.decode(token) as CustomJWTPayload;
      console.log('Request Controller: Token decoded successfully:', decoded);

      return this.repositoriesService.findAll(decoded);
    } catch {
      console.error('Request Controller: Error decoding token');
      throw new Error('Invalid token - unable to process');
    }
  }
}
