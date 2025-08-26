import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
} from '@nestjs/common';
import { ResourceService } from './resource.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BackendJwtPayload, RequestWithHeaders } from '../lib/types';
import { RequestWithCookies } from '../lib/types';
import { UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@ApiBearerAuth('access-token')
@Controller('resource')
export class ResourceController {
  constructor(private readonly resourceService: ResourceService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new resource',
  })
  create(@Body() createResourceDto: CreateResourceDto) {
    return this.resourceService.create(createResourceDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Find all resources for the authenticated user',
  })
  findAll(@Request() req: RequestWithHeaders) {
    const token = (req as RequestWithCookies).cookies?.['access_token'];
    if (token === undefined) {
      throw new UnauthorizedException('No access token');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not defined');
    }

    try {
      const decoded = jwt.verify(token, secret) as unknown;
      const payload = decoded as BackendJwtPayload;
      return this.resourceService.findAll(payload);
    } catch (err) {
      console.error('Resource Controller: Error decoding token', err);
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Find a resource by ID',
  })
  findOne(@Param('id') id: string) {
    return this.resourceService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a resource by ID',
  })
  update(
    @Param('id') id: string,
    @Body() updateResourceDto: UpdateResourceDto,
  ) {
    return this.resourceService.update(+id, updateResourceDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a resource by ID',
  })
  remove(@Param('id') id: string) {
    return this.resourceService.remove(+id);
  }
}
