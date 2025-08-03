import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, Status } from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { ApiBody } from '@nestjs/swagger';
import { Repository } from '@prisma/client';
import { BackendJwtPayload } from '../lib/types';

@Injectable()
export class RequestService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(user: BackendJwtPayload) {
    return await this.databaseService.request.findMany({
      where: { ownerId: user.id },
      include: {
        resources: true,
        repository: true,
        owner: true,
      },
    });
  }

  async findByStatus(status: Status) {
    return await this.databaseService.request.findMany({
      where: { status },
    });
  }

  async findById(id: number) {
    return await this.databaseService.request.findUnique({
      where: { id: id.toString() },
    });
  }

  @ApiBody({ type: CreateRequestDto })
  async createRequest(dto: CreateRequestDto, user: BackendJwtPayload) {
    const { repository, resources, ...request } = dto;
    const ownerId = user.id;

    const ownerInDb = await this.databaseService.user.findUnique({
      where: { id: ownerId },
      select: { id: true },
    });

    if (!ownerInDb) {
      throw new BadRequestException('Authenticated user not found in database');
    }

    // Check repository name uniqueness
    const existingRepo = await this.databaseService.repository.findUnique({
      where: { name: repository.name },
    });
    if (existingRepo)
      throw new ConflictException('Repository name already exists');

    // Verify collaborators exist
    const collaboratorIds =
      repository.collaborators?.map((c) => c.userId) || [];

    const collaboratorsInDb = await this.databaseService.user.findMany({
      where: { id: { in: collaboratorIds } },
      select: { id: true },
    });

    if (collaboratorsInDb.length !== collaboratorIds.length) {
      throw new BadRequestException('One or more collaborators not found');
    }

    // Create resourceConfig with VMs, DBs, STs
    const resourceConfig = await this.databaseService.resourceConfig.create({
      data: {
        vms: { create: resources.resourceConfig.vms || [] },
        dbs: { create: resources.resourceConfig.dbs || [] },
        sts: { create: resources.resourceConfig.sts || [] },
      },
    });

    // Create Resources linked to resourceConfig
    const newResource = await this.databaseService.resources.create({
      data: {
        name: resources.name,
        cloudProvider: resources.cloudProvider,
        region: resources.region,
        resourceConfig: { connect: { id: resourceConfig.id } },
      },
    });

    // Create Repository with collaborators (using userId)
    const newRepository = await this.databaseService.repository.create({
      data: {
        name: repository.name,
        description: repository.description,
        resources: { connect: { id: newResource.id } },
        RepositoryCollaborator: {
          create:
            repository.collaborators?.map((c) => ({ userId: c.userId })) || [],
        },
      },
    });

    // Generate displayCode for Request
    const lastRequest = await this.databaseService.request.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { displayCode: true },
    });
    const lastNumber = lastRequest
      ? parseInt(lastRequest.displayCode.split('-')[1])
      : 0;
    const displayCode = `R-${lastNumber + 1}`;

    // Create Request linking owner, repository, resources
    const newRequest = await this.databaseService.request.create({
      data: {
        description: request.description,
        displayCode,
        owner: { connect: { id: ownerId } },
        repository: { connect: { id: newRepository.id } },
        resources: { connect: { id: newResource.id } },
      },
      include: {
        resources: true,
        repository: true,
        owner: true,
      },
    });

    return newRequest;
  }

  async updateRequestInfo(id: string, updateData: Prisma.RequestUpdateInput) {
    return this.databaseService.request.update({
      where: { id: id.toString() },
      data: updateData,
    });
  }

  async findWithRequestDisplayCode(
    displayCode: string,
    user: BackendJwtPayload,
  ) {
    const request = await this.databaseService.request.findUnique({
      where: { ownerId: user.id, displayCode },
      include: {
        resources: {
          include: {
            resourceConfig: {
              include: {
                vms: true,
                dbs: true,
                sts: true,
              },
            },
          },
        },
        repository: {
          include: {
            RepositoryCollaborator: {
              include: {
                user: true,
              },
            },
          },
        },
        owner: true,
      },
    });

    if (!request) {
      throw new UnauthorizedException(
        "Request not found or you don't have access to it",
      );
    }

    return request;
  }

  async removeRequest(id: number) {
    return this.databaseService.request.delete({
      where: { id: id.toString() },
    });
  }
}
