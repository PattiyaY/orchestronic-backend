import { Module } from '@nestjs/common';
import { RequestController } from './request.controller';
import { RequestService } from './request.service';
import { DatabaseModule } from '../database/database.module';
import { GitlabService } from 'src/gitlab/gitlab.service';
import { RepositoriesService } from 'src/repositories/repositories.service';
import { RabbitmqService } from 'src/rabbitmq/rabbitmq.service';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    DatabaseModule,
    ClientsModule.register([
      {
        name: 'RABBITMQ_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'request',
        },
      },
    ]),
  ],
  controllers: [RequestController],
  providers: [
    RequestService,
    GitlabService,
    RepositoriesService,
    RabbitmqService,
  ],
})
export class RequestModule {}
