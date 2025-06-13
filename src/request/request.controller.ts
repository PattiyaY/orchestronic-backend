import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { RequestService } from './request.service';

import { Prisma } from '@prisma/client';

@Controller('request')
export class RequestController {
  constructor(private readonly requestService: RequestService) {}

  @Get()
  findAll(@Query('status') status?: 'Pending' | 'Approved' | 'Rejected') {
    return this.requestService.findAll(status);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.requestService.findById(+id);
  }

  @Post()
  createRequest(@Body() request: Prisma.RequestCreateInput) {
    return this.requestService.createRequest(request);
  }

  @Patch(':id')
  updateRequestInfo(
    @Param('id') id: string,
    @Body() requestUpdate: Prisma.RequestUpdateInput,
  ) {
    return this.requestService.updateRequestInfo(+id, { ...requestUpdate });
  }

  @Delete(':id')
  removeRequest(@Param('id') id: string) {
    return this.requestService.removeRequest(+id);
  }
}
