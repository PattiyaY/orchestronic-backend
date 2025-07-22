import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma, Status } from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { ApiBody } from '@nestjs/swagger';
import { Repository } from '@prisma/client';
import { CustomJWTPayload } from 'src/lib/types';

@Injectable()
export class RequestService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(user: CustomJWTPayload) {
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
  async createRequest(dto: CreateRequestDto, user: CustomJWTPayload) {
    const { repository, resources, ...request } = dto;

    const ownerId = user.id;
    const resourceConfig = await this.databaseService.resourceConfig.create({
      data: {
        vms: {
          create: resources.resourceConfig.vms?.map((vm) => ({
            name: vm.name,
            numberOfCores: vm.numberOfCores,
            memory: vm.memory,
            os: vm.os,
          })),
        },
        dbs: {
          create: resources.resourceConfig.dbs?.map((db) => ({
            engine: db.engine,
            storageGB: db.storageGB,
          })),
        },
        sts: {
          create: resources.resourceConfig.sts?.map((st) => ({
            type: st.type,
            capacityGB: st.capacityGB,
          })),
        },
      },
    });

    const newResource = await this.databaseService.resources.create({
      data: {
        name: resources.name,
        cloudProvider: resources.cloudProvider,
        region: resources.region,
        resourceConfig: {
          connect: {
            id: resourceConfig.id,
          },
        },
      },
    });

    let newRepository: Repository;
    try {
      newRepository = await this.databaseService.repository.create({
        data: {
          name: repository.name,
          description: repository.description,
          resources: {
            connect: {
              id: newResource.id,
            },
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException(
            `A repository with the name '${repository.name}' already exists. Please choose a different name.`,
          );
        }
      }
      throw error;
    }

    const last = await this.databaseService.request.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { displayCode: true },
    });

    const lastNumber = last?.displayCode
      ? parseInt(last.displayCode.split('-')[1])
      : 0;

    const displayCode = `R-${lastNumber + 1}`;

    const newRequest = await this.databaseService.request.create({
      data: {
        description: request.description,
        displayCode: displayCode,
        owner: {
          connect: {
            id: ownerId,
          },
        },
        repository: {
          connect: {
            id: newRepository.id,
          },
        },
        resources: {
          connect: {
            id: newResource.id,
          },
        },
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

  async findWithRequestDisplayCode(displayCode: string) {
    const request = await this.databaseService.request.findUnique({
      where: { displayCode },
      include: {
        resources: true,
        repository: true,
        owner: true,
      },
    });

    if (!request) {
      throw new Error(`Request with displayCode ${displayCode} not found`);
    }

    return request;
  }

  async removeRequest(id: number) {
    return this.databaseService.request.delete({
      where: { id: id.toString() },
    });
  }
}
