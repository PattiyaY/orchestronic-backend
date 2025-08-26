import {
  Body,
  Controller,
  Post,
  Request,
  UnauthorizedException,
  Param,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AirflowService } from './airflow.service';
import { BackendJwtPayload } from '../lib/types';
import { RequestWithCookies } from '../lib/types';
import * as jwt from 'jsonwebtoken';
import { DagDto } from './dto/dag.dto';

@ApiBearerAuth('access-token')
@Controller('airflow')
export class AirflowController {
  constructor(private readonly airflowService: AirflowService) {}

  @Post(':dagId/dagRuns')
  @ApiOperation({
    summary: 'Trigger a new DAG run',
    description:
      'Triggers a specified Airflow DAG with the provided configuration.',
  })
  triggerDag(
    @Request() req: RequestWithCookies,
    @Param('dagId') dagId: string,
    @Body() body: DagDto,
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
      return this.airflowService.triggerDag(payload, dagId, body);
    } catch (error) {
      throw new UnauthorizedException('Invalid token - unable to process');
    }
  }
}
