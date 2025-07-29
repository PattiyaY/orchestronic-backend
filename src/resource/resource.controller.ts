import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ResourceService } from './resource.service';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { extractToken } from '../lib/extract-token';
import { BackendJwtPayload, RequestWithHeaders } from '../lib/types';
import * as jwt from 'jsonwebtoken';

@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('resource')
export class ResourceController {
  constructor(private readonly resourceService: ResourceService) {}

  @Post()
  create(@Body() createResourceDto: CreateResourceDto) {
    return this.resourceService.create(createResourceDto);
  }

  @Get()
  findAll(@Request() req: RequestWithHeaders) {
    const token = extractToken(req);

    try {
      const decoded = jwt.decode(token) as BackendJwtPayload;
      return this.resourceService.findAll(decoded);
    } catch {
      console.error('Request Controller: Error decoding token');
      throw new Error('Invalid token - unable to process');
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.resourceService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateResourceDto: UpdateResourceDto,
  ) {
    return this.resourceService.update(+id, updateResourceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.resourceService.remove(+id);
  }
}
