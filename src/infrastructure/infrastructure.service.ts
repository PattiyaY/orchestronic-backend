import { Injectable } from '@nestjs/common';
import { CreateInfrastructureDto } from './dto/create-infrastructure.dto';
import { UpdateInfrastructureDto } from './dto/update-infrastructure.dto';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class InfrastructureService {
  constructor(private readonly databaseService: DatabaseService) {}

  create(createInfrastructureDto: CreateInfrastructureDto) {
    return 'This action adds a new infrastructure';
  }

  async findAll() {
    // Requests summary
    const totalRequests = await this.databaseService.request.count();
    const approvedRequests = await this.databaseService.request.count({
      where: { status: 'Approved' },
    });
    const declinedRequests = await this.databaseService.request.count({
      where: { status: 'Rejected' },
    });
    const pendingRequests = await this.databaseService.request.count({
      where: { status: 'Pending' },
    });

    // Resource groups
    const totalResourceGroups = await this.databaseService.resources.count();

    // VM summary
    const totalAzureVMs = await this.databaseService.azureVMInstance.count();
    const totalAwsVMs = await this.databaseService.awsVMInstance.count();
    // Example: running/pending status (if you have a status field)
    // const runningAzureVMs = await this.databaseService.azureVMInstance.count({ where: { status: 'Running' } });
    // const pendingAzureVMs = await this.databaseService.azureVMInstance.count({ where: { status: 'Pending' } });

    // DB summary
    const totalAzureDBs =
      await this.databaseService.azureDatabaseInstance.count();
    const totalAwsDBs = await this.databaseService.awsDatabaseInstance.count();

    // Storage summary
    const totalAzureSTs =
      await this.databaseService.azureStorageInstance.count();
    const totalAwsSTs = await this.databaseService.awsStorageInstance.count();

    // Add more as needed (e.g., by region, by owner, etc.)

    return {
      requests: {
        total: totalRequests,
        approved: approvedRequests,
        declined: declinedRequests,
        pending: pendingRequests,
      },
      resourceGroups: totalResourceGroups,
      vms: {
        azure: totalAzureVMs,
        aws: totalAwsVMs,
        // runningAzure: runningAzureVMs,
        // pendingAzure: pendingAzureVMs,
      },
      dbs: {
        azure: totalAzureDBs,
        aws: totalAwsDBs,
      },
      storage: {
        azure: totalAzureSTs,
        aws: totalAwsSTs,
      },
      // Add more fields for other infrastructure metrics as needed
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} infrastructure`;
  }

  update(id: number, updateInfrastructureDto: UpdateInfrastructureDto) {
    return `This action updates a #${id} infrastructure`;
  }

  remove(id: number) {
    return `This action removes a #${id} infrastructure`;
  }
}
