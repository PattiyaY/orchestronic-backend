import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, Status, Role, CloudProvider } from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import { CreateAzureRequestDto } from './dto/create-request-azure.dto';
import { ApiBody } from '@nestjs/swagger';
import { BackendJwtPayload } from '../lib/types';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import { AirflowService } from '../airflow/airflow.service';
import { RequestStatus } from './dto/request-status.dto';
import { CreateAwsResourceDto } from 'src/resource/dto/create-aws-resource.dto';
import { CreateAwsRequestDto } from './dto/create-request-aws.dto';

@Injectable()
export class RequestService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly rabbitmqService: RabbitmqService,
    private readonly airflowService: AirflowService,
  ) {}

  async findAll(user: BackendJwtPayload) {
    const whereClause =
      user.role === Role.Admin || user.role === Role.IT
        ? {}
        : { ownerId: user.id };

    return await this.databaseService.request.findMany({
      where: whereClause,
      select: {
        id: true,
        displayCode: true,
        createdAt: true,
        status: true,
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
        resources: {
          select: {
            id: true,
            name: true,
          },
        },
        repository: {
          select: {
            id: true,
            name: true,
          },
        },
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

  @ApiBody({ type: CreateAzureRequestDto })
  async createRequestAzure(
    dto: CreateAzureRequestDto,
    user: BackendJwtPayload,
  ) {
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
        AzureVMInstance: {
          create: (resources.resourceConfig.vms || []).map((vm) => ({
            name: vm.name,
            numberOfCores: vm.numberOfCores,
            memory: vm.memory,
            os: vm.os,
            sizeId: vm.sizeId,
          })),
        },
        AzureDatabase: {
          create: resources.resourceConfig.dbs || [],
        },
        AzureStorage: {
          create: resources.resourceConfig.sts || [],
        },
      },
    });

    // Create Resources linked to resourceConfig
    const newResource = await this.databaseService.resources.create({
      data: {
        name: resources.name,
        cloudProvider: resources.cloudProvider as CloudProvider,
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
        resources: {
          include: {
            resourceConfig: {
              include: {
                AzureVMInstance: true,
                AzureDatabase: true,
                AzureStorage: true,
              },
            },
          },
        },
        repository: true,
        owner: true,
      },
    });

    return newRequest;
  }

  @ApiBody({ type: CreateAwsRequestDto })
  async createRequestAws(dto: CreateAwsRequestDto, user: BackendJwtPayload) {
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
        AwsVMInstance: {
          create: (resources.resourceConfig.vms || []).map((vm) => ({
            instanceName: vm.instanceName,
            os: vm.os,
            keyName: vm.keyName,
            sgName: vm.sgName,
            awsInstanceTypeId: vm.awsInstanceTypeId,
          })),
        },
        AwsDatabase: {
          create: resources.resourceConfig.dbs || [],
        },
        AwsStorage: {
          create: resources.resourceConfig.sts || [],
        },
      },
    });

    // Create Resources linked to resourceConfig
    const newResource = await this.databaseService.resources.create({
      data: {
        name: resources.name,
        cloudProvider: resources.cloudProvider as CloudProvider,
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
        resources: {
          include: {
            resourceConfig: {
              include: {
                AwsVMInstance: true,
                AwsDatabase: true,
                AwsStorage: true,
              },
            },
          },
        },
        repository: true,
        owner: true,
      },
    });

    return newRequest;
  }

  async updateRequestInfo(
    user: BackendJwtPayload,
    id: string,
    updateData: Prisma.RequestUpdateInput,
  ) {
    const updateStatus = this.databaseService.request.update({
      where: { id: id.toString() },
      data: updateData,
      include: {
        repository: true,
      },
    });

    // TODO: Fetch data from DB to see how many resources of each type were requested
    if (updateData.status === RequestStatus.Approved) {
      const request = await this.databaseService.request.findFirst({
        where: { id: id.toString() },
        select: {
          resourcesId: true,
        },
      });

      if (!request?.resourcesId) {
        throw new Error(`No resourcesId found for request ${id}`);
      }

      const result = await this.databaseService.resources.findFirst({
        where: { id: request?.resourcesId },
        select: {
          cloudProvider: true,
        },
      });

      const cloudProvider = result?.cloudProvider;

      if (!cloudProvider) {
        throw new Error(
          `No cloudProvider found for resourcesId ${request?.resourcesId}`,
        );
      }

      if (cloudProvider == CloudProvider.AWS) {
        this.rabbitmqService.queueRequest(id.toString());
        this.airflowService.triggerDag(user, 'AWS_Resources');
      } else if (cloudProvider == CloudProvider.AZURE) {
        this.rabbitmqService.queueRequest(id.toString());
        this.airflowService.triggerDag(user, 'AZURE_Resource_Group');
      } else {
        throw new Error(`Unsupported cloudProvider: ${cloudProvider}`);
      }
    }
    return updateStatus;
  }

  async updateRequestFeedback(id: string, feedback?: string) {
    return this.databaseService.request.update({
      where: { id },
      data: { feedback: feedback || null },
    });
  }

  async findWithRequestDisplayCode(
    displayCode: string,
    user: BackendJwtPayload,
  ) {
    const whereClause =
      user.role === Role.Admin || user.role === Role.IT
        ? { displayCode }
        : { displayCode, ownerId: user.id };
    const request = await this.databaseService.request.findUnique({
      where: whereClause,
      include: {
        resources: {
          include: {
            resourceConfig: {
              include: {
                AzureVMInstance: {
                  include: {
                    size: true,
                  },
                },
                AzureDatabase: true,
                AzureStorage: true,
                AwsVMInstance: {
                  include: {
                    AwsInstanceType: true,
                  },
                },
                AwsDatabase: {
                  include: { dbInstanceClass: true },
                },
                AwsStorage: true,
              },
            },
          },
        },
        repository: {
          select: {
            id: true,
            name: true,
            status: true,
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

  async removeRequest(id: string) {
    return this.databaseService.request.delete({
      where: { id: id },
    });
  }

  async getVmSizes() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await (this.databaseService as any).azureVMSize.findMany();
    } catch (error) {
      console.error('Error fetching VM sizes:', error);
      throw new InternalServerErrorException('Failed to fetch VM sizes');
    }
  }

  async getVmSizesPaginated(params: {
    page?: number;
    limit?: number;
    search?: string;
    minCores?: number;
    maxCores?: number;
    minMemory?: number;
    maxMemory?: number;
  }) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        minCores,
        maxCores,
        minMemory,
        maxMemory,
      } = params;

      // Build the where clause for filtering
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = {};

      if (search) {
        where.name = {
          contains: search,
          mode: 'insensitive',
        };
      }

      if (minCores !== undefined || maxCores !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const coresFilter: any = {};
        if (minCores !== undefined) {
          coresFilter.gte = Number(minCores);
        }
        if (maxCores !== undefined) {
          coresFilter.lte = Number(maxCores);
        }
        where.numberOfCores = coresFilter;
      }

      if (minMemory !== undefined || maxMemory !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const memoryFilter: any = {};
        if (minMemory !== undefined) {
          memoryFilter.gte = Number(minMemory);
        }
        if (maxMemory !== undefined) {
          memoryFilter.lte = Number(maxMemory);
        }
        where.memoryInMB = memoryFilter;
      }

      // Calculate offset
      const skip = (page - 1) * limit;

      // Get total count for pagination
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const total = await (this.databaseService as any).azureVMSize.count({
        where,
      });

      // Get paginated data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await (this.databaseService as any).azureVMSize.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: [
          { numberOfCores: 'asc' },
          { memoryInMB: 'asc' },
          { name: 'asc' },
        ],
      });

      // Calculate pagination metadata
      const totalPages = Math.ceil(total / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages,
          hasNext,
          hasPrev,
        },
      };
    } catch (error) {
      console.error('Error fetching VM sizes:', error);
      throw new InternalServerErrorException('Failed to fetch VM sizes');
    }
  }
}
