import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { RequestService } from './request.service';
import { Prisma, Status } from '@prisma/client';
import { ApiBearerAuth, ApiBody, ApiQuery } from '@nestjs/swagger';
import { CreateRequestDto } from './dto/create-request.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('request')
export class RequestController {
  constructor(private readonly requestService: RequestService) {}

  @Get()
  findAll() {
    return this.requestService.findAll();
  }

  @Get('status')
  @ApiQuery({ name: 'status', enum: Status })
  findByStatus(@Query('status') status: Status) {
    return this.requestService.findByStatus(status);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.requestService.findById(+id);
  }

  @Post()
  @ApiBody({ type: CreateRequestDto })
  createRequest(@Request() req, @Body() request: CreateRequestDto) {
    return this.requestService.createRequest(request, req.user);
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
