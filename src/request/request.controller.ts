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
  async createRequest(@Request() req, @Body() request: CreateRequestDto) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Authorization header missing or malformed');
    }

    const token = authHeader.split(' ')[1];

    try {
      console.log('Request Controller: Attempting to import jose library...');
      const { decodeJwt } = await import('jose');
      console.log(
        'Request Controller: Successfully imported jose, decoding token...',
      );
      const decoded = decodeJwt(token);
      console.log('Request Controller: Token decoded successfully:', decoded);

      return this.requestService.createRequest(request, decoded);
    } catch (error) {
      console.error(
        'Request Controller: Error importing jose or decoding token:',
        error,
      );
      console.error('Request Controller: Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
      });
      throw new Error('Invalid token - unable to process');
    }
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
