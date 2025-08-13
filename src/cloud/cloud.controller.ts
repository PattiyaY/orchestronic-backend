import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { CloudService } from './cloud.service';
import { SecretDto } from './dto/secret.dto';
import { RequestWithHeaders } from '../lib/types';
import { extractToken } from '../lib/extract-token';
import * as jwt from 'jsonwebtoken';
import { BackendJwtPayload } from '../lib/types';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('access-token')
@Controller('cloud')
export class CloudController {
  constructor(private readonly cloudService: CloudService) {}

  @Get()
  @ApiOperation({
    summary: 'Get cloud data',
  })
  getCloudData(@Request() req: RequestWithHeaders) {
    const token = extractToken(req);

    try {
      const decoded = jwt.decode(token) as BackendJwtPayload;

      if (!decoded) {
        throw new UnauthorizedException('User not authenticated');
      }

      return this.cloudService.getSecretById(decoded);
    } catch (error) {
      console.error('Cloud Controller: Error decoding token', error);
      throw new UnauthorizedException('Invalid token - unable to process');
    }
  }

  @Post('secret')
  @ApiOperation({
    summary: 'Create a new secret',
  })
  createSecret(
    @Body() secretData: SecretDto,
    @Request() req: RequestWithHeaders,
  ) {
    const token = extractToken(req);

    try {
      const decoded = jwt.decode(token) as BackendJwtPayload;

      if (!decoded) {
        throw new UnauthorizedException('User not authenticated');
      }

      return this.cloudService.createSecret(decoded, secretData);
    } catch (error) {
      console.error('Cloud Controller: Error decoding token', error);
      throw new UnauthorizedException('Invalid token - unable to process');
    }
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a secret by ID',
  })
  updateSecret(
    @Request() req: RequestWithHeaders,
    @Param('id') id: string,
    @Body() secretData: SecretDto,
  ) {
    const token = extractToken(req);
    try {
      const decoded = jwt.decode(token) as BackendJwtPayload;

      if (!decoded) {
        throw new UnauthorizedException('User not authenticated');
      }

      return this.cloudService.updateSecret(decoded, id, secretData);
    } catch (error) {
      console.error('Cloud Controller: Error decoding token', error);
      throw new UnauthorizedException('Invalid token - unable to process');
    }
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a secret by ID',
  })
  deleteSecret(@Request() req: RequestWithHeaders, @Param('id') id: string) {
    const token = extractToken(req);

    try {
      const decoded = jwt.decode(token) as BackendJwtPayload;

      if (!decoded) {
        throw new UnauthorizedException('User not authenticated');
      }

      return this.cloudService.deleteSecret(decoded, id);
    } catch (error) {
      console.error('Cloud Controller: Error decoding token', error);
      throw new UnauthorizedException('Invalid token - unable to process');
    }
  }
}
