import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { BackendJwtPayload } from 'src/lib/types';
import { DagDto } from './dto/dag.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AirflowService {
  constructor(private readonly httpService: HttpService) {}

  async triggerDag(user: BackendJwtPayload, dagId: string, dagInfo: DagDto) {
    if (user.role !== 'Admin' && user.role !== 'IT') {
      throw new UnauthorizedException(
        'User does not have permission to trigger DAGs',
      );
    }

    const path = `/api/v1/dags/${encodeURIComponent(dagId)}/dagRuns`;
    const payload = { conf: { projectId: dagInfo.projectId } };

    const authHeader =
      'Basic ' +
      Buffer.from(
        `${process.env.AIRFLOW_USERNAME}:${process.env.AIRFLOW_PASSWORD}`,
      ).toString('base64');

    try {
      const response$ = this.httpService.post(
        `${process.env.AIRFLOW_BASE_URL ?? 'http://localhost:8080'}${path}`,
        payload,
        {
          auth: {
            username: process.env.AIRFLOW_USERNAME ?? 'airflow',
            password: process.env.AIRFLOW_PASSWORD ?? 'airflow',
          },
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const resp = await firstValueFrom(response$);
      return resp.data;
    } catch (err: any) {
      console.log(err);
      throw new HttpException(
        {
          message: 'Failed to trigger Airflow DAG',
          details: err?.response?.data ?? err?.message ?? 'Unknown error',
        },
        err?.response?.status ?? HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
