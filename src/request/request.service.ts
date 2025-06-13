import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class RequestService {
  constructor(private readonly databaseService: DatabaseService) {}

  async findAll(status?: 'Pending' | 'Approved' | 'Rejected') {
    if (status) {
      return await this.databaseService.request.findMany({
        where: status ? { status } : {},
      });
    }
  }

  async findById(id: number) {
    return await this.databaseService.request.findUnique({
      where: { id: id.toString() },
    });
  }

  /*
Prisma needs to know what action to perform on this relation.

"create" tells Prisma: "When creating this Request, also create a new Resources record with the following data."
so that's why sent data this format:

"resources": {
  "create": {
    "VM": 2,
    "DB": 1,
    "ST": 3
  }
}

*/

  async createRequest(request: Prisma.RequestCreateInput) {
    return this.databaseService.request.create({
      data: request,
    });
  }

  async updateRequestInfo(id: number, updateData: Prisma.RequestUpdateInput) {
    return this.databaseService.request.update({
      where: { id: id.toString() },
      data: updateData,
    });
  }

  async removeRequest(id: number) {
    return this.databaseService.request.delete({
      where: { id: id.toString() },
    });
  }
}
