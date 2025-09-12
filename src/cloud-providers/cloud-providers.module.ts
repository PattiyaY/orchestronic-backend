import { Module } from '@nestjs/common';
import { CloudProvidersService } from './cloud-providers.service';
import { CloudProvidersController } from './cloud-providers.controller';
import { DatabaseModule } from 'src/database/database.module';
import { RequestService } from 'src/request/request.service';
import { AirflowModule } from 'src/airflow/airflow.module';
import { RabbitmqModule } from 'src/rabbitmq/rabbitmq.module';
import { GitlabModule } from 'src/gitlab/gitlab.module';

@Module({
  imports: [DatabaseModule, RabbitmqModule, AirflowModule, GitlabModule],
  controllers: [CloudProvidersController],
  providers: [CloudProvidersService, RequestService],
})
export class CloudProvidersModule {}
