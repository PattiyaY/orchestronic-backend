import ast
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from datetime import datetime, timedelta
import os
from pathlib import Path
from dotenv import load_dotenv

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
# Step 1: RabbitMQ Consumer
# -------------------------
import pika, json

def rabbitmq_consumer():
    load_dotenv(os.path.expanduser('opt/airflow/dags/.env'))
    rabbit_url = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672")

    connection = pika.BlockingConnection(pika.URLParameters(rabbit_url))
    channel = connection.channel()

    method_frame, header_frame, body = channel.basic_get(queue='request', auto_ack=True)
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
# Step 2: Fetch from Supabase
# -------------------------
import psycopg2

def fetch_from_database(request_id):
    if not request_id:
        raise ValueError("No message received from RabbitMQ. Stop DAG run.")

    load_dotenv(os.path.expanduser('opt/airflow/dags/.env'))

    USER = os.getenv("user")
    PASSWORD = os.getenv("password")
    HOST = os.getenv("host")
    PORT = os.getenv("port")
    DBNAME = os.getenv("dbname")

    if not all([USER, PASSWORD, HOST, PORT, DBNAME]):
        raise ValueError("Database credentials are missing in .env")

    try:
        connection = psycopg2.connect(
            user=USER,
            password=PASSWORD,
            host=HOST,
            port=PORT,
            dbname=DBNAME
        )
        cursor = connection.cursor()

        # Get resourcesId from requests table
        cursor.execute('SELECT "resourcesId" FROM "Request" WHERE id = %s;', (request_id,))
        res = cursor.fetchone()
        if not res:
            raise ValueError(f"No request found for id={request_id}")
        resourcesId = res[0]

        # Get resource data
        cursor.execute('''
            SELECT "name", "region", "cloudProvider", "resourceConfigId" 
            FROM "Resources" 
            WHERE id = %s;
        ''', (resourcesId,))
        resource = cursor.fetchone()
        if not resource:
            raise ValueError(f"No resource found for resourcesId={resourcesId}")

        repoName, region, cloudProvider, resourceConfigId = resource

        # Get Database instance
        cursor.execute('SELECT * FROM "DatabaseInstance" WHERE "resourceConfigId" = %s;', (resourceConfigId,))
        databaseInstance = cursor.fetchall()

        cursor.close()
        connection.close()

        configInfo = {
            "resourcesId": resourcesId,
            "repoName": repoName,
            "region": region,
            "cloudProvider": cloudProvider,
            "databaseInstance": databaseInstance
        }

        return configInfo

    except Exception as e:
        raise RuntimeError(f"Database error: {e}")

# -------------------------
# Step 3: Create Terraform Directory
# -------------------------
def create_terraform_directory(configInfo):
    config_dict = ast.literal_eval(configInfo)
    projectName = config_dict['repoName']
    terraform_dir = f"/Users/pattiyayiadram/airflow/dags/terraform/{projectName}"
    os.makedirs(terraform_dir, exist_ok=True)
    print(f"[x] Terraform directory ready: {terraform_dir}")
    return terraform_dir

# -------------------------
# Step 4: Write Terraform DB Files
# -------------------------
def write_terraform_db_files(terraform_dir, configInfo):
    import json
    import os
    from datetime import datetime
    from dotenv import load_dotenv
    from os.path import expanduser
    import ast

    config_dict = ast.literal_eval(configInfo)
    db_keys = ["id", "name", "engine", "username", "password", "storageGB", "skuName"]

    def to_map(instance, keys):
        if not instance:
            return {}
        return {k: v for k, v in zip(keys, instance)}

    def ensure_list(instances, keys):
        if not instances:
            return []
        if isinstance(instances[0], (list, tuple)):
            return [to_map(i, keys) for i in instances]
        else:
            return [to_map(instances, keys)]

    database_resources = ensure_list(config_dict.get("databaseInstance"), db_keys)
    load_dotenv(expanduser('opt/airflow/dags/.env'))

    # -------------------------
    # terraform.auto.tfvars
    # -------------------------
    tfvars_content = f"""
subscription_id      = "{os.getenv('AZURE_SUBSCRIPTION_ID')}"
client_id            = "{os.getenv('AZURE_CLIENT_ID')}"
client_secret        = "{os.getenv('AZURE_CLIENT_SECRET')}"
tenant_id            = "{os.getenv('AZURE_TENANT_ID')}"
project_location     = "{config_dict['region']}"
database_resources   = {json.dumps(database_resources, indent=4)}
"""
    tfvars_file = os.path.join(terraform_dir, f"{config_dict['repoName']}-db.auto.tfvars")
    if not os.path.exists(tfvars_file):
        with open(tfvars_file, "w") as f:
            f.write(tfvars_content)
        print(f"[x] Created {tfvars_file}")

    # -------------------------
    # variables.tf
    # -------------------------
    variables_tf_content = """
variable "subscription_id" {}
variable "client_id" {}
variable "client_secret" {}
variable "tenant_id" {}
variable "project_location" {}
variable "database_resources" { type = list(map(any)) }
"""
    variables_file = os.path.join(terraform_dir, f"{config_dict['repoName']}-db.variables.tf")
    if not os.path.exists(variables_file):
        with open(variables_file, "w") as f:
            f.write(variables_tf_content)
        print(f"[x] Created {variables_file}")

    # -------------------------
    # main.tf
    # -------------------------
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    main_tf_file = os.path.join(terraform_dir, f"{config_dict['repoName']}-db-{timestamp}.tf")
    main_tf_content = f"""
terraform {{
  required_providers {{
    azurerm = {{
      source  = "hashicorp/azurerm"
      version = "~>3.0"
    }}
  }}
}}

provider "azurerm" {{
  features {{}}
  subscription_id = var.subscription_id
  client_id       = var.client_id
  client_secret   = var.client_secret
  tenant_id       = var.tenant_id
}}

resource "azurerm_resource_group" "rg" {{
  name     = "rg-{config_dict['repoName']}"
  location = var.project_location
}}

resource "azurerm_postgresql_flexible_server" "db" {{
  for_each = {{ for db in var.database_resources : db["id"] => db }}

  name                = each.value["name"]
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  sku_name            = lookup(each.value, "skuName", "B_Standard_B1ms")
  version             = each.value["engine"]
  administrator_login    = each.value["username"]
  administrator_password = each.value["password"]
  storage_mb = each.value["storageGB"] * 1024
  backup_retention_days       = 7
  high_availability_mode      = "Disabled"
  public_network_access_enabled = true
}}

output "db_names" {{
  value = {{ for k, v in azurerm_postgresql_flexible_server.db : k => v.name }}
}}
"""
    with open(main_tf_file, "w") as f:
        f.write(main_tf_content)
    print(f"[x] Created {main_tf_file}")

    return main_tf_file

# -------------------------
# DAG Definition
# -------------------------
with DAG(
    'terraform_db_provision',
    default_args=default_args,
    schedule_interval=None,
    catchup=False,
    max_active_runs=5,
) as dag:

    consume_task = PythonOperator(
        task_id="consume_rabbitmq",
        python_callable=rabbitmq_consumer,
        execution_timeout=timedelta(seconds=15),
    )

    fetch_task = PythonOperator(
        task_id="fetch_config",
        python_callable=fetch_from_database,
        op_args=["{{ ti.xcom_pull(task_ids='consume_rabbitmq') }}"],
    )

    create_dir_task = PythonOperator(
        task_id="create_terraform_dir",
        python_callable=create_terraform_directory,
        op_args=["{{ ti.xcom_pull(task_ids='fetch_config') }}"],
    )

    write_files_task = PythonOperator(
        task_id="write_terraform_files",
        python_callable=write_terraform_db_files,
        op_args=["{{ ti.xcom_pull(task_ids='create_terraform_dir') }}",
                 "{{ ti.xcom_pull(task_ids='fetch_config') }}"],
    )

    terraform_init = BashOperator(
        task_id="terraform_init",
        bash_command="cd {{ ti.xcom_pull(task_ids='create_terraform_dir') }} && set -e && terraform init",
    )

    terraform_apply = BashOperator(
        task_id="terraform_apply",
        bash_command="cd {{ ti.xcom_pull(task_ids='create_terraform_dir') }} && set -e && terraform apply -auto-approve",
    )

    consume_task >> fetch_task >> create_dir_task >> write_files_task >> terraform_init >> terraform_apply
