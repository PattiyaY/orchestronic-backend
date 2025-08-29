import { Injectable } from '@nestjs/common';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { DatabaseService } from '../database/database.service';
import { BackendJwtPayload } from '../lib/types';

export interface AzureRetailPriceItem {
  currencyCode: string;
  tierMinimumUnits: number;
  retailPrice: number;
  unitPrice: number;
  armRegionName: string;
  location: string;
  effectiveStartDate: string;
  meterId: string;
  meterName: string;
  productId: string;
  skuId: string;
  productName: string;
  skuName: string;
  serviceName: string;
  serviceId: string;
  serviceFamily: string;
  unitOfMeasure: string;
  type: string;
  isPrimaryMeterRegion: boolean;
  armSkuName: string;
}

export interface AzureRetailPriceResponse {
  BillingCurrency: string;
  CustomerEntityId: string;
  CustomerEntityType: string;
  Items: AzureRetailPriceItem[];
  NextPageLink: string | null;
  Count: number;
}

@Injectable()
export class ResourceService {
  constructor(private readonly databaseService: DatabaseService) {}

  create(createResourceDto: CreateResourceDto) {
    return `this action add new resource`;
  }

  async getVmPrice(vmSize: string, region: string) {
    const url = `https://prices.azure.com/api/retail/prices?$filter=armSkuName eq '${vmSize}' and armRegionName eq '${region}' and priceType eq 'Consumption' and serviceName eq 'Virtual Machines'`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Azure API responded with ${res.status}`);
      }
      const data = (await res.json()) as AzureRetailPriceResponse;
      return data;
    } catch (err) {
      throw new Error(`Failed to fetch Azure VM price: ${err.message}`);
    }
  }

  findAll(user: BackendJwtPayload) {
    return this.databaseService.resources.findMany({
      where: { request: { ownerId: user.id } },
      include: {
        request: {
          select: {
            id: true,
            displayCode: true,
          },
        },
        resourceConfig: {
          include: {
            vms: {
              select: {
                id: true,
              },
            },
            dbs: {
              select: {
                id: true,
              },
            },
            sts: {
              select: {
                id: true,
              },
            },
          },
        },
        repository: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} resource`;
  }

  update(id: number, updateResourceDto: UpdateResourceDto) {
    return `This action updates a #${id} resource`;
  }

  remove(id: number) {
    return `This action removes a #${id} resource`;
  }
}
