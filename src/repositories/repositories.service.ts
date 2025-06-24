import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateRepositoriesDto } from './dto/create-repository.dto';

@Injectable()
export class RepositoriesService {
  constructor(private readonly databaseService: DatabaseService) {}

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

  async createRepository(repository: CreateRepositoriesDto) {
    const existingRepository = await this.findByName(repository.name);
    if (existingRepository.exists) {
      return {
        message: 'Repository already exists',
      };
    }

    const newRepository = await this.databaseService.repository.create({
      data: {
        name: repository.name,
        description: repository.description || '',
        developers: {
          connect: repository.collaborators.map((email: string) => ({ email })),
        },
      },
    });

    return newRepository;
  }
}
