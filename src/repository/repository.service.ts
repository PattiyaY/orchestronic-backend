import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class RepositoryService {
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

  async createRepository(repository: { name: string; description?: string }) {
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
      },
    });

    return newRepository;
  }
}
