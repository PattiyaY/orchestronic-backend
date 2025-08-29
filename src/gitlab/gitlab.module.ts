import { Module } from '@nestjs/common';
import { GitlabService } from './gitlab.service';
import { GitlabController } from './gitlab.controller';
import { GitlabSyncService } from './gitlab-sync.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [GitlabController],
  providers: [GitlabService, GitlabSyncService],
})
export class GitlabModule {}
