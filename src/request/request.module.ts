import { Module } from '@nestjs/common';
import { RequestController } from './request.controller';
import { RequestService } from './request.service';
import { DatabaseModule } from '../database/database.module';
import { GitlabService } from 'src/gitlab/gitlab.service';
import { RepositoriesService } from 'src/repositories/repositories.service';

@Module({
  imports: [DatabaseModule],
  controllers: [RequestController],
  providers: [RequestService, GitlabService, RepositoriesService],
})
export class RequestModule {}
