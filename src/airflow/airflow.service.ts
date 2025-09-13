import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { BackendJwtPayload } from 'src/lib/types';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AirflowService {
  constructor(private readonly httpService: HttpService) {}

  async triggerDag(user: BackendJwtPayload, dagId: string) {
    if (user.role == 'Admin' || user.role == 'IT') {
      const path = `/api/v1/dags/${encodeURIComponent(dagId)}/dagRuns`;
      const payload = { conf: {} };

      try {
        const response$ = this.httpService.post(
          `${process.env.AIRFLOW_BASE_URL ?? 'http://localhost:8080/airflow'}${path}`,
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

        // this.getTaskInstances(resp.data.dag_id, resp.data.dag_run_id);
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
    } else {
      throw new UnauthorizedException(
        'You do not have permission to trigger DAGs',
      );
    }
  }

  async getTaskLogs(
    dagId: string,
    dagRunId: string,
    taskId: string,
    tryNumber = 1,
  ) {
    const path = `/api/v1/dags/${encodeURIComponent(dagId)}/dagRuns/${encodeURIComponent(
      dagRunId,
    )}/taskInstances/${encodeURIComponent(taskId)}/logs/${tryNumber}`;

    try {
      const response$ = this.httpService.get(
        `${process.env.AIRFLOW_BASE_URL ?? 'http://localhost:8080/airflow'}${path}`,
        {
          auth: {
            username: process.env.AIRFLOW_USERNAME ?? 'airflow',
            password: process.env.AIRFLOW_PASSWORD ?? 'airflow',
          },
        },
      );
      const resp = await firstValueFrom(response$);
      return resp.data.content; // 'content' contains log text in Airflow 2.x
    } catch (err: any) {
      console.error(err);
      return `Failed to fetch logs: ${err?.message ?? 'Unknown error'}`;
    }
  }
}
