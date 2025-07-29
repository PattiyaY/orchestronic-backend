import { Injectable } from '@nestjs/common';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { DatabaseService } from '../database/database.service';
import { BackendJwtPayload } from '../lib/types';

@Injectable()
export class ResourceService {
  constructor(private readonly databaseService: DatabaseService) {}

  create(createResourceDto: CreateResourceDto) {
    return `this action add new resource`;
  }

  findAll(user: BackendJwtPayload) {
    return this.databaseService.resources.findMany({
      where: { request: { ownerId: user.id } },
      include: {
        resourceConfig: {
          include: {
            vms: true,
            dbs: true,
            sts: true,
          },
        },
        repository: true,
        request: true,
      },
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} resource`;
  }

  update(id: number, updateResourceDto: UpdateResourceDto) {
    return `This action updates a #${id} resource`;
  }

  remove(id: number) {
    return `This action removes a #${id} resource`;
  }
}
