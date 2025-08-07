import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Role, User } from '@prisma/client';
import { BackendJwtPayload } from '../lib/types';

@Injectable()
export class UserService {
  constructor(private readonly databaseService: DatabaseService) {}

  async createUser(user: CreateUserDto) {
    return await this.databaseService.user.create({
      data: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  }

  async updateRole(id: string, role: Role) {
    return this.databaseService.user.update({
      where: { id },
      data: { role },
    });
  }

  async findOne(email: string): Promise<User | null> {
    return await this.databaseService.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return await this.databaseService.user.findUnique({
      where: { id },
    });
  }

  async findAllUsers() {
    return await this.databaseService.user.findMany();
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.databaseService.user.findUnique({
      where: {
        email: email,
      },
    });
  }

  async fuzzyFindUsersByEmail(email: string): Promise<User[]> {
    return await this.databaseService.user.findMany({
      where: {
        email: {
          contains: email,
          mode: 'insensitive',
        },
      },
      take: 5,
    });
  }

  async findUserInfo(user: BackendJwtPayload) {
    return await this.databaseService.user.findUnique({
      where: { id: user.id },
    });
  }
}
