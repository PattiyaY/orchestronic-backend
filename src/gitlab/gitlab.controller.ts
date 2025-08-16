import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { GitlabService } from './gitlab.service';
import { CreateGitlabDto } from './dto/create-gitlab.dto';
import { UpdateGitlabDto } from './dto/update-gitlab.dto';

@Controller('gitlab')
export class GitlabController {
  constructor(private readonly gitlabService: GitlabService) {}

  @Post()
  create(@Body() createGitlabDto: CreateGitlabDto) {
    return this.gitlabService.createProject(createGitlabDto);
  }

  @Get()
  findAll() {
    return this.gitlabService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.gitlabService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateGitlabDto: UpdateGitlabDto) {
    return this.gitlabService.update(+id, updateGitlabDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.gitlabService.remove(+id);
  }
}
