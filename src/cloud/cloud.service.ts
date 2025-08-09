import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { BackendJwtPayload } from '../lib/types';
import { SecretDto } from './dto/secret.dto';
import { CloudProvider } from '@prisma/client';

@Injectable()
export class CloudService {
  constructor(private readonly databaseService: DatabaseService) {}

  getSecretById(user: BackendJwtPayload) {
    return this.databaseService.cloudResourceSecret.findMany({
      where: { userId: user.id },
      select: {
        clientId: true,
        clientSecret: true,
        subscriptionId: true,
        tenantId: true,
        cloudProvider: true,
      },
    });
  }

  createSecret(user: BackendJwtPayload, secretData: SecretDto) {
    return this.databaseService.cloudResourceSecret.create({
      data: {
        ...secretData,
        cloudProvider:
          CloudProvider[
            secretData.cloudProvider.toUpperCase() as keyof typeof CloudProvider
          ],
        userId: user.id,
      },
    });
  }
}
