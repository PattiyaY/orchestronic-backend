import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { InfrastructureService } from './infrastructure.service';
import { InfrastructureController } from './infrastructure.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [InfrastructureController],
  providers: [InfrastructureService],
})
export class InfrastructureModule {}
