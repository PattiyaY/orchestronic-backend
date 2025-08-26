import ast
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from datetime import datetime, timedelta
from urllib.parse import urlparse
import pika
import os
import json
from dotenv import load_dotenv
from os.path import expanduser

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from pathlib import Path

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
def rabbitmq_consumer():
    load_dotenv(expanduser('opt/airflow/dags/.env'))
    rabbit_url = os.getenv("RABBITMQ_URL")
    rabbit_url = "amqp://guest:guest@localhost:5672"
    if not rabbit_url:
        raise ValueError("RABBITMQ_URL is not set in .env")

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
from dotenv import load_dotenv
from os.path import expanduser
import os

def fetch_from_database(request_id):
    if not request_id:
        raise ValueError("No message received from RabbitMQ. Stop DAG run.")

    # Load environment variables
    load_dotenv(expanduser('opt/airflow/dags/.env'))

    # Fetch variables
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

        # 1️⃣ Get resourcesId from requests table
        cursor.execute('SELECT "resourcesId" FROM "Request" WHERE id = %s;', (request_id,))
        res = cursor.fetchone()
        if not res:
            raise ValueError(f"No request found for id={request_id}")
        resourcesId = res[0]

        # 2️⃣ Get resource data
        cursor.execute('''
            SELECT "name", "region", "cloudProvider", "resourceConfigId" 
            FROM "Resources" 
            WHERE id = %s;
        ''', (resourcesId,))
        resource = cursor.fetchone()
        if not resource:
            raise ValueError(f"No resource found for resourcesId={resourcesId}")

        repoName, region, cloudProvider, resourceConfigId = resource

        # 3️⃣ Get VM instance
        cursor.execute('SELECT * FROM "VMInstance" WHERE "resourceConfigId" = %s;', (resourceConfigId,))
        vmInstance = cursor.fetchone()

        # 4️⃣ Get Database instance
        cursor.execute('SELECT * FROM "DatabaseInstance" WHERE "resourceConfigId" = %s;', (resourceConfigId,))
        databaseInstance = cursor.fetchone()

        # 5️⃣ Get Storage instance
        cursor.execute('SELECT * FROM "StorageInstance" WHERE "resourceConfigId" = %s;', (resourceConfigId,))
        storageInstance = cursor.fetchone()

        # Close cursor and connection
        cursor.close()
        connection.close()

        # Build config info dict
        configInfo = {
            "resourcesId": resourcesId,
            "repoName": repoName,
            "region": region,
            "cloudProvider": cloudProvider,
            "vmInstance": vmInstance,
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
    print(f"[x] Created directory {terraform_dir}")
    return terraform_dir

# -------------------------
# Step 3.5: Generate SSH Key
# -------------------------
def generate_ssh_key(terraform_dir, repo_name):
    private_key_path = Path(terraform_dir) / f"{repo_name}.pem"
    public_key_path = Path(terraform_dir) / f"{repo_name}.pub"

    # Generate RSA private key
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=4096
    )

    # Save private key
    with open(private_key_path, "wb") as f:
        f.write(private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption()
        ))

    # Save public key in OpenSSH format
    public_key = private_key.public_key()
    with open(public_key_path, "wb") as f:
        f.write(public_key.public_bytes(
            encoding=serialization.Encoding.OpenSSH,
            format=serialization.PublicFormat.OpenSSH
        ))

    print(f"[x] Generated SSH key pair: {private_key_path}, {public_key_path}")
    return str(public_key_path)  # <-- return public key path as string

# -------------------------
# Step 4: Write Terraform Files
# -------------------------
def write_terraform_files(terraform_dir, configInfo, public_key_path):
    import os, json, ast

    config_dict = ast.literal_eval(configInfo)

    # Helper: convert DB tuple/list into dict
    def to_map(instance, keys):
        if not instance:
            return {}
        return {k: v for k, v in zip(keys, instance)}

    # Keys for each resource type (adjust as per your DB schema)
    vm_keys = ["id", "name", "os"]

    # Ensure each is a list
    def ensure_list(instances, keys):
        if not instances:
            return []
        if isinstance(instances[0], (list, tuple)):
            return [to_map(i, keys) for i in instances]
        else:
            return [to_map(instances, keys)]

    vm_resources = ensure_list(config_dict.get("vmInstance"), vm_keys)

    load_dotenv(expanduser('opt/airflow/dags/.env'))
    # terraform.auto.tfvars
    tfvars_content = f"""
subscription_id      = "{os.getenv('AZURE_SUBSCRIPTION_ID')}"
client_id            = "{os.getenv('AZURE_CLIENT_ID')}"
client_secret        = "{os.getenv('AZURE_CLIENT_SECRET')}"
tenant_id            = "{os.getenv('AZURE_TENANT_ID')}"
project_location     = "{config_dict['region']}"
ssh_public_key_path  = "{public_key_path}"

vm_resources         = {json.dumps(vm_resources, indent=4)}
"""
    with open(f"{terraform_dir}/terraform.auto.tfvars", "w") as f:
        f.write(tfvars_content)

    # main.tf with for_each for multiple VMs
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

resource "azurerm_virtual_network" "vnet" {{
  name                = "vnet-{config_dict['repoName']}"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  address_space       = ["10.0.0.0/16"]
}}

resource "azurerm_subnet" "subnet" {{
  name                 = "subnet-{config_dict['repoName']}"
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = ["10.0.1.0/24"]
}}

# Create public IPs for each VM
resource "azurerm_public_ip" "public_ip" {{
  for_each = {{ for vm in var.vm_resources : vm.id => vm }}

  name                = "publicip-${{each.value.name}}"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  allocation_method   = "Dynamic"
}}

# Create NICs for each VM
resource "azurerm_network_interface" "nic" {{
  for_each = {{ for vm in var.vm_resources : vm.id => vm }}

  name                = "nic-${{each.value.name}}"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  ip_configuration {{
    name                          = "internal"
    subnet_id                     = azurerm_subnet.subnet.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.public_ip[each.key].id
  }}
}}

# Create Linux VMs for each resource
resource "azurerm_linux_virtual_machine" "vm" {{
  for_each = {{ for vm in var.vm_resources : vm.id => vm }}

  name                 = "${{each.value.name}}-vm"
  resource_group_name  = azurerm_resource_group.rg.name
  location             = azurerm_resource_group.rg.location
  size                 = "Standard_B1s"
  admin_username       = "azureuser"
  network_interface_ids = [
    azurerm_network_interface.nic[each.key].id
  ]

  admin_ssh_key {{
    username   = "azureuser"
    public_key = file(var.ssh_public_key_path)
  }}

  os_disk {{
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }}

  source_image_reference {{
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-focal"
    sku       = "20_04-lts"
    version   = "latest"
  }}
}}

output "public_ip" {{
  value = {{ for k, v in azurerm_public_ip.public_ip : k => v.ip_address }}
}}
"""
    with open(f"{terraform_dir}/main.tf", "w") as f:
        f.write(main_tf_content)

    # variables.tf
    variables_tf = """
variable "subscription_id" {}
variable "client_id" {}
variable "client_secret" {}
variable "tenant_id" {}
variable "project_location" {}
variable "ssh_public_key_path" {}
variable "vm_resources" { type = list(map(any)) }
"""
    with open(f"{terraform_dir}/variables.tf", "w") as f:
        f.write(variables_tf)

    print("[x] Terraform files written successfully for multiple VMs, NICs, and public IPs.")


# -------------------------
# DAG Definition
# -------------------------
with DAG(
    'terraform_vm_provision',
    default_args=default_args,
    schedule_interval=None,
    catchup=False,
    max_active_runs=5,  # allow multiple manual triggers
) as dag:

    # Consume RabbitMQ
    consume_task = PythonOperator(
        task_id="consume_rabbitmq",
        python_callable=rabbitmq_consumer,
        execution_timeout=timedelta(seconds=15),
    )

    # Fetch config from Supabase
    fetch_task = PythonOperator(
        task_id="fetch_config",
        python_callable=fetch_from_database,
        op_args=["{{ ti.xcom_pull(task_ids='consume_rabbitmq') }}"],
    )

    # Create Terraform Directory
    create_dir_task = PythonOperator(
        task_id="create_terraform_dir",
        python_callable=create_terraform_directory,
        op_args=["{{ ti.xcom_pull(task_ids='fetch_config') }}"],
    )

    # Generate SSH Key
    generate_ssh_task = PythonOperator(
        task_id="generate_ssh_key",
        python_callable=generate_ssh_key,
        op_args=[
            "{{ ti.xcom_pull(task_ids='create_terraform_dir') }}",
            "{{ ti.xcom_pull(task_ids='fetch_config')['repoName'] }}"
        ],
    )

    # Write Terraform Files
    write_files_task = PythonOperator(
        task_id="write_terraform_files",
        python_callable=write_terraform_files,
        op_args=["{{ ti.xcom_pull(task_ids='create_terraform_dir') }}",
                 "{{ ti.xcom_pull(task_ids='fetch_config') }}",
                  "{{ ti.xcom_pull(task_ids='generate_ssh_key') }}"],

    )

    # Terraform Init
    terraform_init = BashOperator(
        task_id="terraform_init",
        bash_command="cd {{ ti.xcom_pull(task_ids='create_terraform_dir') }} && set -e && terraform init",
    )

    # Terraform Apply
    terraform_apply = BashOperator(
        task_id="terraform_apply",
        bash_command="cd {{ ti.xcom_pull(task_ids='create_terraform_dir') }} && set -e && terraform apply -auto-approve",
    )

    # DAG Flow
    consume_task >> fetch_task >> create_dir_task >> generate_ssh_task >> write_files_task >> terraform_init >> terraform_apply
