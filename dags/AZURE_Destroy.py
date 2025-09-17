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
    directory_path = f"/opt/airflow/dags/terraform/rg-{projectName}"
    if os.path.exists(directory_path):
        shutil.rmtree(directory_path)
    return projectName

# -------------------------
# DAG Definition
# -------------------------
with DAG(
    dag_id='AZURE_Destroy',
    default_args=default_args,
    schedule=None,
    catchup=False,
    max_active_runs=1,
) as dag:

    # Step 1: Get request ID
    get_request_id = PythonOperator(
        task_id="get_request_id",
        python_callable=rabbitmq_consumer,
    )

    # Step 2: Get repository/project name
    get_repository_name = PythonOperator(
        task_id="get_repository_name",
        python_callable=repository_name,
        op_args=["{{ ti.xcom_pull(task_ids='get_request_id') }}"],
    )

    remove_locks = BashOperator(
    task_id="remove_rg_locks",
    bash_command=(
        'RG_NAME="rg-{{ ti.xcom_pull(task_ids=\'get_repository_name\') | trim | replace(\'"\',\'\') }}"; '
        'echo "Checking for locks on RG: $RG_NAME"; '
        'locks=$(az lock list --resource-group $RG_NAME --query "[].{name:name,id:id}" -o tsv); '
        'if [ -z "$locks" ]; then '
        '  echo "No locks on RG $RG_NAME"; '
        'else '
        '  echo "Found locks:"; echo "$locks"; '
        '  while read lockName lockId; do '
        '    echo "Deleting lock $lockName (id $lockId)"; '
        '    az lock delete --ids "$lockId"; '
        '  done <<< "$locks"; '
        'fi'
    ),
    env={
                "ARM_SUBSCRIPTION_ID": "2dc6fdaa-24a9-47d2-9d0c-a40db11f90f4",
                "ARM_CLIENT_ID": "261e7add-e11f-4531-8f72-ea459ebc38",
                "ARM_CLIENT_SECRET": "-xu8Q~mHtELRMqrK0gz_vOKKtXfTfUgfe6A~Fb_l",
                "ARM_TENANT_ID": "c1f3dc23-b7f8-48d3-9b5d-2b12f158f01f",
            },
    retries=2,
    retry_delay=timedelta(minutes=2),
    )
    
    # Step 3: Terraform destroy subfolders safely
    destroy_tasks = []
    subfolders = ["db", "st", "vm"]

    for sub in subfolders:
        task = BashOperator(
            task_id=f"terraform_destroy_{sub}",
            bash_command=(
                'cd "/opt/airflow/dags/terraform/rg-{{ ti.xcom_pull(task_ids=\'get_repository_name\') | trim | replace(\'"\',\'\') }}/' + sub + '" && '
                'terraform init && terraform destroy -auto-approve'
            ),
            env={
                "ARM_SUBSCRIPTION_ID": "2dc6fdaa-24a9-47d2-9d0c-a40db11f90f4",
                "ARM_CLIENT_ID": "261e7add-e11f-4531-8f72-ea459ebc38",
                "ARM_CLIENT_SECRET": "-xu8Q~mHtELRMqrK0gz_vOKKtXfTfUgfe6A~Fb_l",
                "ARM_TENANT_ID": "c1f3dc23-b7f8-48d3-9b5d-2b12f158f01f",
            },
            retries=3,
            retry_delay=timedelta(minutes=5)
        )
    destroy_tasks.append(task)


    # Step 4: Cleanup folder
    cleanup_dir = PythonOperator(
        task_id="cleanup_dir",
        python_callable=cleanup_directory,
        op_args=["{{ ti.xcom_pull(task_ids='get_repository_name') }}"],
    )

    # Step 5: Delete DB record via Prisma
    delete_request_prisma = BashOperator(
        task_id='delete_request_prisma',
        bash_command='node /opt/airflow/dags/deleteRequest.js {{ ti.xcom_pull(task_ids="get_request_id") }}',
    )

    # -------------------------
    # Task dependencies
    # -------------------------
    get_request_id >> get_repository_name >> remove_locks
    for task in destroy_tasks:
      get_repository_name >> task >> cleanup_dir 
    cleanup_dir >> delete_request_prisma





