import os
import json
import pika
import psycopg2
import shutil
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from datetime import datetime, timedelta
from dotenv import load_dotenv
from os.path import expanduser
load_dotenv(expanduser('/opt/airflow/dags/.env'))


# -------------------------
# Default DAG args
# -------------------------
default_args = {
    'owner': 'admin',
    'depends_on_past': False,
    'start_date': datetime(2025, 1, 1),
    'retries': 1,
}

# -------------------------
# Step 1: RabbitMQ consumer
# -------------------------
def rabbitmq_consumer():
    load_dotenv(expanduser('/opt/airflow/dags/.env'))
    rabbit_url = os.getenv("RABBITMQ_URL")
    if not rabbit_url:
        raise ValueError("RABBITMQ_URL is not set in .env")

    connection = pika.BlockingConnection(pika.URLParameters(rabbit_url))
    channel = connection.channel()

    method_frame, header_frame, body = channel.basic_get(queue='destroy', auto_ack=True)
    if method_frame:
        message = body.decode()
        obj = json.loads(message)
        request_id = obj["data"]["requestId"]
        print(f"[x] Got message: {request_id}")
        connection.close()
        return request_id
    else:
        print("[x] No message in queue")
        connection.close()
        return None

# -------------------------
# Step 2: Get repository/project name
# -------------------------
def repository_name(request_id):
    load_dotenv(expanduser('/opt/airflow/dags/.env'))

    USER = os.getenv("DB_USER")
    PASSWORD = os.getenv("DB_PASSWORD")
    HOST = os.getenv("DB_HOST")
    PORT = os.getenv("DB_PORT")
    DBNAME = os.getenv("DB_NAME")

    connection = psycopg2.connect(
        user=USER,
        password=PASSWORD,
        host=HOST,
        port=PORT,
        dbname=DBNAME,
    )
    cursor = connection.cursor()
    try:
        cursor.execute('SELECT "repositoryId" FROM "Request" WHERE id = %s;', (request_id,))
        res = cursor.fetchone()
        if not res:
            raise ValueError(f"No request found for id={request_id}")
        repositoryId = res[0]

        cursor.execute('SELECT "name" FROM "Repository" WHERE id = %s;', (repositoryId,))
        row = cursor.fetchone()
        if not row:
            raise ValueError(f"No repository found for id={repositoryId}")
        return row[0]
    finally:
        cursor.close()
        connection.close()

# -------------------------
# Step 3: Cleanup folder
# -------------------------
def cleanup_directory(projectName):
    directory_path = f"/opt/airflow/dags/terraform/{projectName}"
    if os.path.exists(directory_path):
        shutil.rmtree(directory_path)
    return projectName

# -------------------------
# DAG Definition
# -------------------------
with DAG(
    dag_id='AWS_Destroy',
    default_args=default_args,
    schedule=None,
    catchup=False,
    max_active_runs=1,
) as dag:
    
    # Get request ID
    get_request_id = PythonOperator(
        task_id="get_request_id",
        python_callable=rabbitmq_consumer,
    )

    # Get repository/project name
    get_repository_name = PythonOperator(
        task_id="get_repository_name",
        python_callable=repository_name,
        op_args=["{{ ti.xcom_pull(task_ids='get_request_id') }}"],
    )

    destroy_rds = BashOperator(
        task_id="terraform_destroy_rds",
        bash_command=(
            'cd "/opt/airflow/dags/terraform/{{ ti.xcom_pull(task_ids=\'get_repository_name\') | trim | replace(\'"\',\'\') }}/db" && '
            'terraform init && terraform destroy -auto-approve'
        ),
        env={
            "AWS_ACCESS_KEY_ID": os.getenv('AWS_ACCESS_KEY'),
            "AWS_SECRET_ACCESS_KEY": os.getenv('AWS_SECRET_KEY'),
            "AWS_DEFAULT_REGION": os.getenv('AWS_DEFAULT_REGION'),
        },
        retries=3,
        retry_delay=timedelta(minutes=5)
    )

    destroy_s3 = BashOperator(
        task_id="terraform_destroy_s3",
        bash_command=(
            'cd "/opt/airflow/dags/terraform/{{ ti.xcom_pull(task_ids=\'get_repository_name\') | trim | replace(\'"\',\'\') }}/st" && '
            'terraform init && terraform destroy -auto-approve'
        ),
        env={
            "AWS_ACCESS_KEY_ID": os.getenv('AWS_ACCESS_KEY'),
            "AWS_SECRET_ACCESS_KEY": os.getenv('AWS_SECRET_KEY'),
            "AWS_DEFAULT_REGION": os.getenv('AWS_DEFAULT_REGION'),
        },
        retries=3,
        retry_delay=timedelta(minutes=5)
    )

    destroy_ec2 = BashOperator(
        task_id="terraform_destroy_ec2",
        bash_command=(
            'cd "/opt/airflow/dags/terraform/{{ ti.xcom_pull(task_ids=\'get_repository_name\') | trim | replace(\'"\',\'\') }}/vm" && '
            'terraform init && terraform destroy -auto-approve'
        ),
        env={
            "AWS_ACCESS_KEY_ID": os.getenv('AWS_ACCESS_KEY'),
            "AWS_SECRET_ACCESS_KEY": os.getenv('AWS_SECRET_KEY'),
            "AWS_DEFAULT_REGION": os.getenv('AWS_DEFAULT_REGION'),
        },
        retries=3,
        retry_delay=timedelta(minutes=5)
    )

    # Cleanup folder
    cleanup_dir = PythonOperator(
        task_id="cleanup_dir",
        python_callable=cleanup_directory,
        op_args=["{{ ti.xcom_pull(task_ids='get_repository_name') }}"],
    )

    # Delete DB record via Prisma
    delete_request_prisma = BashOperator(
        task_id='delete_request_prisma',
        bash_command='node /opt/airflow/dags/deleteRequest.js {{ ti.xcom_pull(task_ids="get_request_id") }}',
    )

    get_request_id >> get_repository_name >> [destroy_ec2, destroy_rds, destroy_s3] >> cleanup_dir >> delete_request_prisma


