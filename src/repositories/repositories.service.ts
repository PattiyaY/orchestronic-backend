import { Injectable, UseGuards } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateRepositoriesDto } from './dto/create-repository.dto';
import { AuthGuard } from '@nestjs/passport';
import { CustomJWTPayload } from 'src/lib/types';

@Injectable()
export class RepositoriesService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(user: CustomJWTPayload) {
    const repoIds = await this.databaseService.request.findMany({
      where: {
        ownerId: user.id,
      },
      select: {
        repositoryId: true,
      },
    });

    const repositoryIdList = repoIds.map((r) => r.repositoryId);

    const listOfRepo = await this.databaseService.repository.findMany({
      where: {
        id: {
          in: repositoryIdList,
        },
      },
      include: {
        resources: true,
        collaborators: true,
        request: true,
      },
    });

    return listOfRepo;
  }

  async findByName(name: string) {
    const foundRepository = await this.databaseService.repository.findUnique({
      where: { name },
    });

    if (!foundRepository) {
      return {
        exists: false,
      };
    }
    return {
      exists: true,
    };
  }

  async createRepository(dto: CreateRepositoriesDto) {
    const { resources, ...repository } = dto;

    const existingRepository = await this.findByName(repository.name);
    if (existingRepository.exists) {
      return { message: 'Repository already exists' };
    }

    const collaborators = await this.databaseService.user.findMany({
      where: {
        email: { in: repository.collaborators },
      },
      select: { email: true },
    });

    const validEmails = collaborators.map((user) => user.email);

    if (validEmails.length !== repository.collaborators.length) {
      const missing = repository.collaborators.filter(
        (email) => !validEmails.includes(email),
      );
      return {
        message: 'Some collaborators not found',
        missing,
      };
    }

    const newResourceConfig = await this.databaseService.resourceConfig.create({
      data: {
        vms: {
          create: resources.resourceConfig.vms.map((vm) => ({
            name: vm.name,
            numberOfCores: vm.numberOfCores,
            memory: vm.memory,
            os: vm.os,
          })),
        },
        dbs: {
          create: resources.resourceConfig.dbs.map((db) => ({
            engine: db.engine,
            storageGB: db.storageGB,
          })),
        },
        sts: {
          create: resources.resourceConfig.sts.map((st) => ({
            type: st.type,
            capacityGB: st.capacityGB,
          })),
        },
      },
    });

    const newResources = await this.databaseService.resources.create({
      data: {
        name: resources.name,
        cloudProvider: resources.cloudProvider,
        region: resources.region,
        resourceConfig: {
          connect: {
            id: newResourceConfig.id,
          },
        },
      },
    });

    const newRepository = await this.databaseService.repository.create({
      data: {
        name: repository.name,
        description: repository.description ?? '',
        collaborators: {
          connect: repository.collaborators?.map((email) => ({ email })) || [],
        },
        resources: {
          connect: {
            id: newResources.id,
          },
        },
      },
    });

    return newRepository;
  }
}
