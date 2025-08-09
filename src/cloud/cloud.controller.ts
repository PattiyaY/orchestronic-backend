import {
  Body,
  Controller,
  Get,
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
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('access-token')
@Controller('cloud')
export class CloudController {
  constructor(private readonly cloudService: CloudService) {}

  @Get()
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
}
