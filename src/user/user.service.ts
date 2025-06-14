import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class UserService {
  constructor(private readonly databaseService: DatabaseService) {}

  async createUser(user: Prisma.UserCreateInput) {
    return await this.databaseService.user.create({
      data: user,
    });
  }
}
