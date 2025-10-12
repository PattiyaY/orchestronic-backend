import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { InfrastructureService } from './infrastructure.service';
import { InfrastructureController } from './infrastructure.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AirflowService } from '../airflow/airflow.service';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import { HttpModule } from '@nestjs/axios';

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
  providers: [InfrastructureService, AirflowService, RabbitmqService],
})
export class InfrastructureModule {}
