import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { RequestService } from 'src/request/request.service';
import { GetVmSizesDto } from 'src/request/dto/get-vm-sizes.dto';

@Injectable()
export class CloudProvidersService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly requestService: RequestService,
  ) {}

  findAzure(query: GetVmSizesDto) {
    return this.requestService.getVmSizesPaginated(query);
  }

  async findAws(params: {
    page?: number;
    limit?: number;
    search?: string;
    minCores?: number;
    maxCores?: number;
    minMemory?: number;
    maxMemory?: number;
  }) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        minCores,
        maxCores,
        minMemory,
        maxMemory,
      } = params;

      // 1️⃣ Fetch all items (or filter by search if you want)
      let items = await this.databaseService.awsInstanceType.findMany({
        orderBy: { createdAt: 'desc' },
      });

      // 2️⃣ Filter in JS
      items = items.filter((item) => {
        const cpu = typeof item.core === 'number' ? item.core : 0;
        const memory = typeof item.ram === 'number' ? item.ram : 0;
        const name = item.id.toLowerCase();

        if (search && !name.includes(search.toLowerCase())) return false;
        if (minCores !== undefined && cpu < minCores) return false;
        if (maxCores !== undefined && cpu > maxCores) return false;
        if (minMemory !== undefined && memory < minMemory) return false;
        if (maxMemory !== undefined && memory > maxMemory) return false;

        return true;
      });

      // 3️⃣ Pagination
      const total = items.length;
      const totalPages = Math.ceil(total / limit);
      const skip = (page - 1) * limit;
      const paginatedItems = items.slice(skip, skip + limit);

      return {
        data: paginatedItems,
        meta: {
          total,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      console.error('Error fetching AWS instance types:', error);
      throw new Error('Failed to fetch AWS instance types');
    }
  }
}
