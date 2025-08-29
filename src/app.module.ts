import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RequestModule } from './request/request.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from './database/database.module';
import { UserController } from './user/user.controller';
import { UserModule } from './user/user.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { RepositoriesModule } from './repositories/repositories.module';
import { RepositoriesController } from './repositories/repositories.controller';
import { RepositoriesService } from './repositories/repositories.service';
import { AuthModule } from './auth/auth.module';
import { ResourceModule } from './resource/resource.module';
import { AirflowService } from './airflow/airflow.service';
import { AirflowController } from './airflow/airflow.controller';
import { RabbitmqService } from './rabbitmq/rabbitmq.service';
import { RabbitmqController } from './rabbitmq/rabbitmq.controller';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';
import { AirflowModule } from './airflow/airflow.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CloudModule } from './cloud/cloud.module';
import { PolicyService } from './policy/policy.service';
import { PolicyController } from './policy/policy.controller';
import { PolicyModule } from './policy/policy.module';
import { HttpModule } from '@nestjs/axios';
import { GitlabModule } from './gitlab/gitlab.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        baseURL:
          config.get<string>('AIRFLOW_BASE_URL') ?? 'http://localhost:8080',
        auth: {
          username: config.get<string>('AIRFLOW_USERNAME') ?? '',
          password: config.get<string>('AIRFLOW_PASSWORD') ?? '',
        },
        timeout: 15000,
      }),
    }),

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
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'swagger-static'),
      serveRoot: process.env.NODE_ENV === 'development' ? '/' : '/swagger',
    }),
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: parseInt(<string>process.env.POSTGRES_PORT),
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DATABASE,
      autoLoadEntities: true,
      synchronize: true,
    }),
    ScheduleModule.forRoot(),
    RequestModule,
    DatabaseModule,
    UserModule,
    RepositoriesModule,
    ResourceModule,
    AuthModule,
    RabbitmqModule,
    AirflowModule,
    CloudModule,
    PolicyModule,
    GitlabModule,
  ],
  controllers: [
    AppController,
    UserController,
    RepositoriesController,
    AirflowController,
    RabbitmqController,
    PolicyController,
  ],
  providers: [
    // { provide: APP_GUARD, useClass: JwtAuthGuard },
    AppService,
    RepositoriesService,
    AirflowService,
    RabbitmqService,
    PolicyService,
  ],
})
export class AppModule {}
