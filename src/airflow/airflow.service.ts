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
    if (
      user.role === 'Admin' ||
      user.role === 'IT' ||
      user.role === 'Developer'
    ) {
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

  async getTaskInstances(dagId: string, dagRunId: string) {
    const path = `/api/v1/dags/${dagId}/dagRuns/${dagRunId}/taskInstances`;

    try {
      const response$ = this.httpService.get(
        `${process.env.AIRFLOW_BASE_URL ?? 'http://localhost:8080/airflow'}${path}`,
        {
          auth: {
            username: process.env.AIRFLOW_USERNAME ?? 'airflow',
            password: process.env.AIRFLOW_PASSWORD ?? 'airflow',
          },
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const resp = await firstValueFrom(response$);
      return resp.data.task_instances;
    } catch (err: any) {
      throw new HttpException(
        {
          message: 'Failed to fetch task instances',
          details: err?.response?.data ?? err?.message ?? 'Unknown error',
        },
        err?.response?.status ?? HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async getTaskLogs(
    dagId: string,
    dagRunId: string,
    taskId: string,
    tryNumber = 1,
  ) {
    const path = `/api/v1/dags/${dagId}/dagRuns/${dagRunId}/taskInstances/${taskId}/logs/${tryNumber}`;
    console.log(path);

    try {
      const response$ = this.httpService.get(
        `${process.env.AIRFLOW_BASE_URL ?? 'http://localhost:8080/airflow'}${path}`,
        {
          auth: {
            username: process.env.AIRFLOW_USERNAME ?? 'airflow',
            password: process.env.AIRFLOW_PASSWORD ?? 'airflow',
          },
          headers: { 'Content-Type': 'application/json' },
        },
      );

      const resp = await firstValueFrom(response$);
      return resp.data?.content ?? resp.data;
    } catch (err: any) {
      return `Error fetching logs for task ${taskId}: ${err?.message ?? 'Unknown error'}`;
    }
  }
}
