import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestEntity } from './models/request.entity';
import { Request } from './models/request.interface';

@Injectable()
export class RequestService {
  constructor(
    @InjectRepository(RequestEntity)
    private readonly requestRepository: Repository<RequestEntity>,
  ) {}

  async findAll(status?: 'Pending' | 'Approved' | 'Rejected') {
    if (status) {
      return await this.requestRepository.find({
        where: { status },
      });
    }
    return await this.requestRepository.find();
  }

  async findById(id: number) {
    return await this.requestRepository.findOneBy({ id });
  }

  async createRequest(request: Omit<Request, 'date'>) {
    const newRequest = this.requestRepository.create(request);
    return await this.requestRepository.save(newRequest);
  }

  async updateRequestInfo(
    id: number,
    updateData: Partial<Omit<Request, 'date'>>,
  ) {
    await this.requestRepository.update(id, updateData);
    return await this.requestRepository.findOneBy({ id });
  }

  async removeRequest(id: number) {
    const request = await this.requestRepository.findOneBy({ id });
    if (!request) return null;
    await this.requestRepository.remove(request);
    return request;
  }
}
