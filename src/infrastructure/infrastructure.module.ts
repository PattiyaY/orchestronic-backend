import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { InfrastructureService } from './infrastructure.service';
import { InfrastructureController } from './infrastructure.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AirflowService } from '../airflow/airflow.service';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import { HttpModule } from '@nestjs/axios';
import { GitlabService } from 'src/gitlab/gitlab.service';

@Module({
  imports: [
    HttpModule,
    DatabaseModule,
    ClientsModule.register([
      {
        name: 'RABBITMQ_SERVICE_1',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'request',
        },
      },
      {
        name: 'RABBITMQ_SERVICE_2',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'destroy',
        },
      },
    ]),
  ],
  controllers: [InfrastructureController],
  providers: [
    InfrastructureService,
    AirflowService,
    RabbitmqService,
    GitlabService,
  ],
})
export class InfrastructureModule {}
