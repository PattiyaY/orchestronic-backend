import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom, timeout } from 'rxjs';

@Injectable()
export class RabbitmqService {
  constructor(@Inject('RABBITMQ_SERVICE') private rabbitClient: ClientProxy) {}

  queueRequest(requestId: string) {
    this.rabbitClient.emit('request', { requestId });
    console.log(`Request ID sent to RabbitMQ: ${requestId}`);

    return { message: 'Request queued successfully', requestId };
  }

  async getRequest() {
    try {
      const response = await lastValueFrom(
        this.rabbitClient.send('request', {}).pipe(timeout(10000)),
      );
      return response;
    } catch (err) {
      console.error('Timeout or error:', err);
      throw err; // optional: rethrow or return fallback
    }
  }
}
