import { Get, Query, Controller, Post, Body } from '@nestjs/common';
import { RepositoryService } from './repository.service';
import { CreateRepositoryDto } from './dto/create-repository.dto';

@Controller('repository')
export class RepositoryController {
  constructor(private readonly repositoryService: RepositoryService) {}

  @Get()
  findByName(@Query('name') name: string) {
    return this.repositoryService.findByName(name);
  }

  @Post()
  createRepository(@Body() repository: CreateRepositoryDto) {
    return this.repositoryService.createRepository(repository);
  }
}
