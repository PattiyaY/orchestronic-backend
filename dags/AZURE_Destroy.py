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
    # rabbit_url = "amqp://guest:guest@host.docker.internal:5672"
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
    
def cleanup_directory(request_id):
    """
    Cleans up the Terraform directory after execution.
    """

    load_dotenv(expanduser('/opt/airflow/dags/.env'))

    USER = os.getenv("DB_USER")
    PASSWORD = os.getenv("DB_PASSWORD")
    HOST = os.getenv("DB_HOST")
    PORT = os.getenv("DB_PORT")
    DBNAME = os.getenv("DB_NAME")

    # print(f"Connecting to database {DBNAME} at {HOST}:{PORT} as user {USER}")

    connection = psycopg2.connect(
        user=USER,
        password=PASSWORD,
        host=HOST,
        port=PORT,
        dbname=DBNAME,
    )
    cursor = connection.cursor()

    # ResourcesId, repositoryId
    cursor.execute(
        'SELECT "repositoryId" FROM "Request" WHERE id = %s;',
        (request_id,)
    )
    res = cursor.fetchone()
    if not res:
        raise ValueError(f"No request found for id={request_id}")
    repositoryId = res

    # ProjectName
    cursor.execute(
        'SELECT "name" FROM "Repository" WHERE id = %s;',
        (repositoryId,)
    )
    row = cursor.fetchone()
    if not row:
        raise ValueError(f"No repository found for id={repositoryId}")
    projectName = row[0]

    directory_path = f"/opt/airflow/dags/terraform/rg-{projectName}"
    if os.path.exists(directory_path):
        shutil.rmtree(directory_path)

    cursor.execute('DELETE FROM "Request" WHERE id = %s;', (request_id,))

    return projectName

# Define DAG
with DAG(
    dag_id='AZURE_Destroy',
    default_args=default_args,
    schedule=None,
    catchup=False,
    max_active_runs=1,
) as dag:
    
     # Step 1: RabbitMQ
    get_request_id = PythonOperator(
        task_id="get_request_id",
        python_callable=rabbitmq_consumer,
    )

    # Step 2 : Clean up Dir
    cleanup_dir = PythonOperator(
        task_id="cleanup_dir",
        python_callable=cleanup_directory,
        op_args=["{{ ti.xcom_pull(task_ids='get_request_id') }}"],
    )

    # Step 3 : Terraform Destroy
    terraform_destroy = BashOperator(
        task_id='terraform_destroy',
        bash_command='terraform init && terraform destroy -auto-approve',
        cwd="/opt/airflow/dags/terraform/rg-{{ ti.xcom_pull(task_ids='cleanup_dir') | trim | replace('\"', '') }}",
        env={
            "ARM_SUBSCRIPTION_ID": os.getenv("AZURE_SUBSCRIPTION_ID"),
            "ARM_CLIENT_ID": os.getenv("AZURE_CLIENT_ID"),
            "ARM_CLIENT_SECRET": os.getenv("AZURE_CLIENT_SECRET"),
            "ARM_TENANT_ID": os.getenv("AZURE_TENANT_ID"),
        },
        retries=3,
        retry_delay=timedelta(minutes=5),
        do_xcom_push=True
    )

get_request_id >> cleanup_dir >> terraform_destroy