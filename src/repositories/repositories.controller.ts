import { Controller, UseGuards } from '@nestjs/common';
import { Get, Query, Post, Body } from '@nestjs/common';
import { RepositoriesService } from './repositories.service';
import { CreateRepositoriesDto } from './dto/create-repository.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('repositories')
export class RepositoriesController {
  constructor(private readonly repositoriesService: RepositoriesService) {}

  @Get('available-repository')
  findByName(@Query('name') name: string) {
    return this.repositoriesService.findByName(name);
  }

  @Post()
  createRepository(@Body() repository: CreateRepositoriesDto) {
    return this.repositoriesService.createRepository(repository);
  }

  @Get()
  findAll() {
    return this.repositoriesService.findAll();
  }
}
