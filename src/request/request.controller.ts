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
import { Prisma, RepositoryStatus, Role, Status } from '@prisma/client';
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
import {
  RequestStatus,
  UpdateRequestStatusDto,
} from './dto/request-status.dto';
import { BackendJwtPayload } from '../lib/types';
import { RequestWithHeaders } from '../lib/types';
import { extractToken } from '../lib/extract-token';
import { GetVmSizesDto } from './dto/get-vm-sizes.dto';
import { PaginatedVmSizesDto } from './dto/paginated-vm-sizes.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { GitlabService } from '../gitlab/gitlab.service';
import { RepositoriesService } from '../repositories/repositories.service';

@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('request')
export class RequestController {
  constructor(
    private readonly requestService: RequestService,
    private readonly gitlabService: GitlabService,
    private readonly repositoryService: RepositoriesService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Find all requests for the authenticated user',
  })
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
  @ApiOperation({
    summary: 'Find requests by status',
  })
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
  @ApiOperation({
    summary: 'Get available VM sizes with pagination and filtering',
  })
  getVmSizes(@Query() query: GetVmSizesDto) {
    return this.requestService.getVmSizesPaginated(query);
  }

  @Get('displayCode')
  @ApiOperation({
    summary: 'Find requests by display code',
  })
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
  @ApiOperation({
    summary: 'Find a request by ID',
  })
  findById(@Param('id') id: string) {
    return this.requestService.findById(+id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new request',
  })
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
  @ApiOperation({
    summary: 'Update request information by request ID',
  })
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

    if (status === RequestStatus.Approved) {
      await this.gitlabService.createProject({
        name: updated.repository.name,
        description: updated.repository.description || '',
        visibility: 'public',
      });
      await this.repositoryService.updateRepository(
        updated.repository.id,
        RepositoryStatus.Created,
      );
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
  @ApiOperation({
    summary: 'Delete a request by ID',
  })
  removeRequest(@Param('id') id: string) {
    return this.requestService.removeRequest(id);
  }
}
