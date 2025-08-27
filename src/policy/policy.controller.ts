import {
  Controller,
  Post,
  Get,
  Request,
  Body,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { PolicyService } from './policy.service';
import { BackendJwtPayload } from '../lib/types';
import { RequestWithCookies } from '../lib/types';
import { UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { VMPolicyDto } from './dto/vm-policy.dto';
import { DBPolicyDto } from './dto/db-policy.dto';
import { STPolicyDto } from './dto/st-policy.dto';
import { CloudProvider } from '@prisma/client';

@Controller('policy')
export class PolicyController {
  constructor(private readonly policyService: PolicyService) {}

  @Post('virtual_machine')
  @ApiOperation({
    summary: 'Create a new Virtual Machine Policy',
    description: 'Creates a new policy for managing virtual machines.',
  })
  createPolicy(
    @Request() req: RequestWithCookies,
    @Body() policyData: VMPolicyDto,
  ) {
    const token = req.cookies?.['access_token'];
    if (token === undefined) {
      throw new UnauthorizedException('No access token');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not defined');
    }

    try {
      const decoded = jwt.verify(token, secret) as unknown;
      const payload = decoded as BackendJwtPayload;
      return this.policyService.createPolicyVM(payload, policyData);
    } catch (error) {
      console.error('Error decoding token:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Post('database')
  @ApiOperation({
    summary: 'Create a new Database Policy',
    description: 'Creates a new policy for managing databases.',
  })
  createPolicyDB(
    @Request() req: RequestWithCookies,
    @Body() policyData: DBPolicyDto,
  ) {
    const token = req.cookies?.['access_token'];
    if (token === undefined) {
      throw new UnauthorizedException('No access token');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not defined');
    }

    try {
      const decoded = jwt.verify(token, secret) as unknown;
      const payload = decoded as BackendJwtPayload;
      return this.policyService.createPolicyDB(payload, policyData);
    } catch (error) {
      console.error('Error decoding token:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Post('storage')
  @ApiOperation({
    summary: 'Create a new Storage Policy',
    description: 'Creates a new policy for managing storage resources.',
  })
  createPolicyST(
    @Request() req: RequestWithCookies,
    @Body() policyData: STPolicyDto,
  ) {
    const token = req.cookies?.['access_token'];
    if (token === undefined) {
      throw new UnauthorizedException('No access token');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not defined');
    }

    try {
      const decoded = jwt.verify(token, secret) as unknown;
      const payload = decoded as BackendJwtPayload;
      return this.policyService.createPolicyST(payload, policyData);
    } catch (error) {
      console.error('Error decoding token:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Patch('virtual_machine')
  @ApiOperation({
    summary: 'Update an existing Virtual Machine Policy',
    description: 'Updates an existing policy for managing virtual machines.',
  })
  updatePolicy(
    @Request() req: RequestWithCookies,
    @Body() policyData: VMPolicyDto,
  ) {
    const token = req.cookies?.['access_token'];
    if (token === undefined) {
      throw new UnauthorizedException('No access token');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not defined');
    }

    try {
      const decoded = jwt.verify(token, secret) as unknown;
      const payload = decoded as BackendJwtPayload;
      return this.policyService.updatePolicyVM(payload, policyData);
    } catch (error) {
      console.error('Error decoding token:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Patch('database')
  @ApiOperation({
    summary: 'Update an existing Database Policy',
    description: 'Updates an existing policy for managing databases.',
  })
  updatePolicyDB(
    @Request() req: RequestWithCookies,
    @Body() policyData: DBPolicyDto,
  ) {
    const token = req.cookies?.['access_token'];
    if (token === undefined) {
      throw new UnauthorizedException('No access token');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not defined');
    }

    try {
      const decoded = jwt.verify(token, secret) as unknown;
      const payload = decoded as BackendJwtPayload;
      return this.policyService.updatePolicyDB(payload, policyData);
    } catch (error) {
      console.error('Error decoding token:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Patch('storage')
  @ApiOperation({
    summary: 'Update an existing Storage Policy',
    description: 'Updates an existing policy for managing storage resources.',
  })
  updatePolicyST(
    @Request() req: RequestWithCookies,
    @Body() policyData: STPolicyDto,
  ) {
    const token = req.cookies?.['access_token'];
    if (token === undefined) {
      throw new UnauthorizedException('No access token');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not defined');
    }

    try {
      const decoded = jwt.verify(token, secret) as unknown;
      const payload = decoded as BackendJwtPayload;
      return this.policyService.updatePolicyST(payload, policyData);
    } catch (error) {
      console.error('Error decoding token:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Get('virtual_machine')
  @ApiOperation({
    summary: 'Get all Virtual Machine Policies',
    description: 'Retrieves all policies for virtual machines.',
  })
  @ApiResponse({
    status: 200,
    description: 'VM policies retrieved successfully',
  })
  getPolicyVM(
    @Request() req: RequestWithCookies,
    @Query('cloudProvider') cloudProvider: CloudProvider,
  ) {
    const token = req.cookies?.['access_token'];
    if (token === undefined) {
      throw new UnauthorizedException('No access token');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not defined');
    }

    try {
      const decoded = jwt.verify(token, secret) as unknown;
      const payload = decoded as BackendJwtPayload;
      return this.policyService.getPolicyVM(payload, cloudProvider);
    } catch (error) {
      console.error('Error decoding token:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Get('database')
  @ApiOperation({
    summary: 'Get all Database Policies',
    description: 'Retrieves all policies for databases.',
  })
  @ApiResponse({
    status: 200,
    description: 'Database policies retrieved successfully',
  })
  getPolicyDB(
    @Request() req: RequestWithCookies,
    @Query('cloudProvider') cloudProvider: CloudProvider,
  ) {
    const token = req.cookies?.['access_token'];
    if (token === undefined) {
      throw new UnauthorizedException('No access token');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not defined');
    }

    try {
      const decoded = jwt.verify(token, secret) as unknown;
      const payload = decoded as BackendJwtPayload;
      return this.policyService.getPolicyDB(payload, cloudProvider);
    } catch (error) {
      console.error('Error decoding token:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  @Get('storage')
  @ApiOperation({
    summary: 'Get all Storage Policies',
    description: 'Retrieves all policies for storage resources.',
  })
  @ApiResponse({
    status: 200,
    description: 'Storage policies retrieved successfully',
  })
  getPolicyST(
    @Request() req: RequestWithCookies,
    @Query('cloudProvider') cloudProvider: CloudProvider,
  ) {
    const token = req.cookies?.['access_token'];
    if (token === undefined) {
      throw new UnauthorizedException('No access token');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET not defined');
    }

    try {
      const decoded = jwt.verify(token, secret) as unknown;
      const payload = decoded as BackendJwtPayload;
      return this.policyService.getPolicyST(payload, cloudProvider);
    } catch (error) {
      console.error('Error decoding token:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
