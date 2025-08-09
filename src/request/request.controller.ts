import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { RequestService } from './request.service';
import { Prisma, Role, Status } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateRequestDto } from './dto/create-request.dto';
import { AuthGuard } from '@nestjs/passport';
import * as jwt from 'jsonwebtoken';
import { UpdateRequestStatusDto } from './dto/request-status.dto';
import { BackendJwtPayload } from '../lib/types';
import { RequestWithHeaders } from '../lib/types';
import { extractToken } from '../lib/extract-token';
import { GetVmSizesDto } from './dto/get-vm-sizes.dto';
import { PaginatedVmSizesDto } from './dto/paginated-vm-sizes.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';

@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('request')
export class RequestController {
  constructor(private readonly requestService: RequestService) {}

  @Get()
  findAll(@Request() req: RequestWithHeaders) {
    const token = extractToken(req);

    try {
      const decoded = jwt.decode(token) as BackendJwtPayload;
      return this.requestService.findAll(decoded);
    } catch {
      console.error('Request Controller: Error decoding token');
      throw new Error('Invalid token - unable to process');
    }
  }

  @Get('status')
  @ApiQuery({ name: 'status', enum: Status })
  findByStatus(@Query('status') status: Status) {
    return this.requestService.findByStatus(status);
  }

  @ApiOperation({
    summary: 'Get available VM sizes',
    description:
      'Retrieves a list of available VM sizes from Azure with pagination and filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'VM sizes retrieved successfully',
    type: PaginatedVmSizesDto,
  })
  @Get('vm-sizes')
  getVmSizes(@Query() query: GetVmSizesDto) {
    return this.requestService.getVmSizesPaginated(query);
  }

  @Get('displayCode')
  @ApiQuery({
    name: 'displayCode',
    description: 'Format: R-[number]',
    required: true,
  })
  async findWithRequestDisplayCode(
    @Query('displayCode') displayCode: string,
    @Request() req: RequestWithHeaders,
  ) {
    const token = extractToken(req);

    if (!/^R-\d+$/.test(displayCode)) {
      throw new BadRequestException(
        'Invalid displayCode format. Expected format: R-<number>',
      );
    }

    try {
      const decoded = jwt.decode(token) as BackendJwtPayload;
      return this.requestService.findWithRequestDisplayCode(
        displayCode,
        decoded,
      );
    } catch {
      console.error('Request Controller: Error decoding token');
      throw new Error('Invalid token - unable to process');
    }
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.requestService.findById(+id);
  }

  @Post()
  @ApiBody({ type: CreateRequestDto })
  async createRequest(
    @Request() req: RequestWithHeaders,
    @Body() request: CreateRequestDto,
  ) {
    const token = extractToken(req);
    try {
      const decoded = jwt.decode(token) as BackendJwtPayload;
      return this.requestService.createRequest(request, decoded);
    } catch {
      console.error('Request Controller: Error decoding token');
      throw new Error('Invalid token - unable to process');
    }
  }

  @Patch(':id')
  updateRequestInfo(
    @Param('id') id: string,
    @Body() requestUpdate: Prisma.RequestUpdateInput,
  ) {
    return this.requestService.updateRequestInfo(id, { ...requestUpdate });
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update request status by request ID',
  })
  async updateRequestStatus(
    @Param('id') id: string,
    @Body() { status }: UpdateRequestStatusDto,
    @Req() req: RequestWithHeaders,
  ) {
    const token = extractToken(req);
    const user = jwt.decode(token) as BackendJwtPayload;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    if (user.role !== 'Admin' && user.role !== 'IT') {
      throw new ForbiddenException(
        'You do not have permission to update status',
      );
    }
    const updated = await this.requestService.updateRequestInfo(id, {
      status,
    });

    if (!updated) {
      throw new NotFoundException(`Request with id ${id} not found`);
    }

    return updated;
  }

  @Patch(':id/feedback')
  @ApiOperation({
    summary: 'Update request feedback by request ID',
  })
  updateRequestFeedback(
    @Param('id') id: string,
    @Body() feedback: UpdateFeedbackDto,
    @Req() req: RequestWithHeaders,
  ) {
    const token = extractToken(req);

    try {
      const decoded = jwt.decode(token) as BackendJwtPayload;

      if (!decoded) {
        throw new UnauthorizedException('User not authenticated');
      }

      if (decoded.role !== 'Admin' && decoded.role !== 'IT') {
        throw new ForbiddenException(
          'You do not have permission to update feedback',
        );
      }

      return this.requestService.updateRequestFeedback(id, feedback.feedback);
    } catch (error) {
      console.error('Request Controller: Error decoding token', error);
      throw new UnauthorizedException('Invalid token - unable to process');
    }
  }

  @Delete(':id')
  removeRequest(@Param('id') id: string) {
    return this.requestService.removeRequest(+id);
  }
}
