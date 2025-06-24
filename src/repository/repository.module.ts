import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { RepositoryService } from './repository.service';
import { RepositoryController } from './repository.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [RepositoryController],
  providers: [RepositoryService],
})
export class RepositoryModule {}
