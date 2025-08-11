import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { BackendJwtPayload } from 'src/lib/types';
import { VMPolicyDto } from './dto/vm-policy.dto';
import { Role } from '@prisma/client';
import { DBPolicyDto } from './dto/db-policy.dto';
import { STPolicyDto } from './dto/st-policy.dto';

@Injectable()
export class PolicyService {
  constructor(private readonly databaseService: DatabaseService) {}

  createPolicyVM(user: BackendJwtPayload, policyData: VMPolicyDto) {
    if (user.role !== Role.Admin) {
      throw new Error('Unauthorized: Only admins can create VM policies');
    }

    return this.databaseService.policyVM.create({
      data: { ...policyData },
    });
  }

  createPolicyDB(user: BackendJwtPayload, policyData: DBPolicyDto) {
    if (user.role !== Role.Admin) {
      throw new Error('Unauthorized: Only admins can create VM policies');
    }

    return this.databaseService.policyDatabase.create({
      data: { ...policyData },
    });
  }

  createPolicyST(user: BackendJwtPayload, policyData: STPolicyDto) {
    if (user.role !== Role.Admin) {
      throw new Error('Unauthorized: Only admins can create ST policies');
    }

    return this.databaseService.policyStorage.create({
      data: { ...policyData },
    });
  }

  updatePolicyVM(user: BackendJwtPayload, policyData: VMPolicyDto) {
    if (user.role !== Role.Admin) {
      throw new Error('Unauthorized: Only admins can update VM policies');
    }
    return this.databaseService.policyVM.updateMany({
      data: { ...policyData },
    });
  }

  updatePolicyDB(user: BackendJwtPayload, policyData: DBPolicyDto) {
    if (user.role !== Role.Admin) {
      throw new Error('Unauthorized: Only admins can update DB policies');
    }
    return this.databaseService.policyDatabase.updateMany({
      data: { ...policyData },
    });
  }

  updatePolicyST(user: BackendJwtPayload, policyData: STPolicyDto) {
    if (user.role !== Role.Admin) {
      throw new Error('Unauthorized: Only admins can update ST policies');
    }
    return this.databaseService.policyStorage.updateMany({
      data: { ...policyData },
    });
  }

  getPolicyVM(user: BackendJwtPayload) {
    if (user.role !== Role.Admin && user.role !== Role.IT) {
      throw new Error('Unauthorized: Only admins and IT can view VM policies');
    }

    try {
      return this.databaseService.policyVM.findFirst({});
    } catch (error) {
      console.error('Error fetching VM policies:', error);
      throw new Error('Failed to fetch VM policies');
    }
  }

  getPolicyDB(user: BackendJwtPayload) {
    if (user.role !== Role.Admin && user.role !== Role.IT) {
      throw new Error('Unauthorized: Only admins and IT can view DB policies');
    }

    try {
      return this.databaseService.policyDatabase.findFirst({});
    } catch (error) {
      console.error('Error fetching DB policies:', error);
      throw new Error('Failed to fetch DB policies');
    }
  }

  getPolicyST(user: BackendJwtPayload) {
    if (user.role !== Role.Admin && user.role !== Role.IT) {
      throw new Error('Unauthorized: Only admins and IT can view ST policies');
    }

    try {
      return this.databaseService.policyStorage.findFirst({});
    } catch (error) {
      console.error('Error fetching ST policies:', error);
      throw new Error('Failed to fetch ST policies');
    }
  }
}
