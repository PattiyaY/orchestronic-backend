import os
import json
import psycopg2
from dotenv import load_dotenv
from os.path import expanduser
from pathlib import Path
from datetime import datetime
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator

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
# def rabbitmq_consumer():
#     load_dotenv(expanduser('/opt/airflow/dags/.env'))
#     rabbit_url = "amqp://guest:guest@host.docker.internal:5672"

#     connection = pika.BlockingConnection(pika.URLParameters(rabbit_url))
#     channel = connection.channel()

#     method_frame, _, body = channel.basic_get(queue='request', auto_ack=True)
#     if method_frame:
#         message = body.decode()
#         obj = json.loads(message)
#         request_id = obj["data"]["requestId"]
#         print(f"[x] Got message: {request_id}")
#         connection.close()
#         return request_id
#     else:
#         print("[x] No message in queue")
#         connection.close()
#         return None

# -------------------------
# Step 2: Fetch from Supabase
# -------------------------
def fetch_from_database(**context):
    request_id = context['dag_run'].conf.get('request_id')
    if not request_id:
        raise ValueError("No message received from RabbitMQ. Stop DAG run.")

    load_dotenv(expanduser('/opt/airflow/dags/.env'))

    USER = os.getenv("DB_USER")
    PASSWORD = os.getenv("DB_PASSWORD")
    HOST = os.getenv("DB_HOST")
    PORT = os.getenv("DB_PORT")
    DBNAME = os.getenv("DB_NAME")

    connection = psycopg2.connect(
        user=USER, password=PASSWORD,
        host=HOST, port=PORT, dbname=DBNAME
    )
    cursor = connection.cursor()

    cursor.execute('SELECT "resourcesId" FROM "Request" WHERE id = %s;', (request_id,))
    res = cursor.fetchone()
    if not res:
        raise ValueError(f"No request found for id={request_id}")
    resourcesId = res[0]

    cursor.execute('''
        SELECT "name", "region", "resourceConfigId"
        FROM "Resources" WHERE id = %s;
    ''', (resourcesId,))
    resource = cursor.fetchone()
    if not resource:
        raise ValueError(f"No resource found for resourcesId={resourcesId}")

    repoName, region, resourceConfigId = resource

    cursor.execute('SELECT * FROM "AzureVMInstance" WHERE "resourceConfigId" = %s;', (resourceConfigId,))
    vmInstances = cursor.fetchall()

    vmSizes = []
    for vm in vmInstances:
        size_id = vm[-1]
        cursor.execute('SELECT "name" FROM "AzureVMSize" WHERE "id" = %s;', (size_id,))
        size = cursor.fetchone()
        vmSizes.append(size)

    cursor.close()
    connection.close()

    return {
        "resourcesId": resourcesId,
        "repoName": repoName,
        "region": region,
        "vmInstances": vmInstances,
        "vmSizes": vmSizes,           
    }


# -------------------------
# Step 3: Terraform Directory
# -------------------------
def create_terraform_directory(configInfo):
    if isinstance(configInfo, str):
        import ast
        configInfo = ast.literal_eval(configInfo)
        
    projectName = configInfo['repoName']
    terraform_dir = f"/opt/airflow/dags/terraform/{projectName}/vm"
    os.makedirs(terraform_dir, exist_ok=True)
    print(f"[x] Created directory {terraform_dir}")
    return terraform_dir

# -------------------------
# Step 3.5: SSH Key
# -------------------------
def generate_ssh_key(terraform_dir, repo_name):
    private_key_path = Path(terraform_dir) / f"{repo_name}.pem"
    public_key_path = Path(terraform_dir) / f"{repo_name}.pub"

    private_key = rsa.generate_private_key(public_exponent=65537, key_size=4096)

    with open(private_key_path, "wb") as f:
        f.write(private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption()
        ))

    public_key = private_key.public_key()
    with open(public_key_path, "wb") as f:
        f.write(public_key.public_bytes(
            encoding=serialization.Encoding.OpenSSH,
            format=serialization.PublicFormat.OpenSSH
        ))

    return str(public_key_path)

# -------------------------
# Step 4: Terraform Files
# -------------------------
def write_terraform_files(terraform_dir, configInfo, public_key_path):
    if isinstance(configInfo, str):
        import ast
        configInfo = ast.literal_eval(configInfo)
        
    config_dict = configInfo
    projectName = f"{config_dict['repoName']}-{config_dict['resourcesId'][:4]}"
    vm_keys = ["id", "name", "os", "resourceConfigId", "sizeId"]
    vm_resources = []
    for vm_instance, vm_size in zip(config_dict['vmInstances'], config_dict['vmSizes']):
        vm_dict = {k: v for k, v in zip(vm_keys, vm_instance)}
        vm_dict["vmSize"] = vm_size[0]
        vm_resources.append(vm_dict)

    load_dotenv(expanduser('/opt/airflow/dags/.env'))
 # terraform.auto.tfvars
    tfvars_content = f"""
subscription_id      = "{os.getenv('AZURE_SUBSCRIPTION_ID')}"
client_id            = "{os.getenv('AZURE_CLIENT_ID')}"
client_secret        = "{os.getenv('AZURE_CLIENT_SECRET')}"
tenant_id            = "{os.getenv('AZURE_TENANT_ID')}"
project_location     = "{config_dict['region']}"
repoName             = "{config_dict['repoName'] + '-' + config_dict['resourcesId'][:4]}"
vm_resources = {json.dumps(vm_resources, indent=4)}
"""
    with open(f"{terraform_dir}/terraform.auto.tfvars", "w") as f:
        f.write(tfvars_content)


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

data "azurerm_resource_group" "rg" {{
  name = "{projectName}"
}}

locals {{
  rg_name     = data.azurerm_resource_group.rg.name
  rg_location = data.azurerm_resource_group.rg.location
}}

resource "azurerm_virtual_network" "vnet" {{
  name                = "vnet-{projectName}"
  location            = local.rg_location
  resource_group_name = local.rg_name
  address_space       = ["10.0.0.0/16"]
}}

resource "azurerm_subnet" "subnet" {{
  name                 = "subnet-{projectName}"
  resource_group_name  = local.rg_name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = ["10.0.1.0/24"]
}}

# Create public IPs for each VM
resource "azurerm_public_ip" "public_ip" {{
  for_each = {{ for vm in var.vm_resources : vm.id => vm }}

  name                = "publicip-${{each.value.name}}"
  location            = local.rg_location
  resource_group_name = local.rg_name
  allocation_method   = "Dynamic"
}}

# Create NICs for each VM
resource "azurerm_network_interface" "nic" {{
  for_each = {{ for vm in var.vm_resources : vm.id => vm }}

  name                = "nic-${{each.value.name}}"
  location            = local.rg_location
  resource_group_name = local.rg_name

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
  resource_group_name  = local.rg_name
  location             = local.rg_location
  size                 = each.value.vmSize
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
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts"
    version   = "latest"
  }}
}}

output "public_ip" {{
  value = {{ for k, v in azurerm_public_ip.public_ip : k => v.ip_address }}
}}
"""

    with open(f"{terraform_dir}/main.tf", "w") as f:
        f.write(main_tf_content)

    load_dotenv(expanduser('/opt/airflow/dags/.env'))

    variables_tf = f"""
        variable "subscription_id" {{
        default = "{os.getenv('AZURE_SUBSCRIPTION_ID')}"
        }}

        variable "client_id" {{
        default = "{os.getenv('AZURE_CLIENT_ID')}"
        }}

        variable "client_secret" {{
        default = "{os.getenv('AZURE_CLIENT_SECRET')}"
        }}

        variable "tenant_id" {{
        default = "{os.getenv('AZURE_TENANT_ID')}"
        }}

        variable "project_location" {{
        default = "{config_dict['region']}"
        }}

        variable "repoName" {{
        default = "{projectName}"
        }}

        variable "ssh_public_key_path" {{
        default = "{public_key_path}"
        }}

        variable "vm_resources" {{
        type = list(map(any))
        }}
    """


    with open(f"{terraform_dir}/variables.tf", "w") as f:
        f.write(variables_tf)

    print("[x] Terraform files written successfully for multiple VMs, NICs, and public IPs.")
   

# -------------------------
# DAG Definition
# -------------------------
with DAG(
    'AZURE_terraform_vm_provision',
    default_args=default_args,
    schedule_interval=None,
    catchup=False,
) as dag:

    # consume_task = PythonOperator(
    #     task_id="consume_rabbitmq",
    #     python_callable=rabbitmq_consumer,
    # )

    fetch_task = PythonOperator(
        task_id="fetch_config",
        python_callable=fetch_from_database,
    )

    create_dir_task = PythonOperator(
        task_id="create_terraform_dir",
        python_callable=create_terraform_directory,
        op_args=["{{ ti.xcom_pull(task_ids='fetch_config') }}"],
    )

    generate_ssh_task = PythonOperator(
        task_id="generate_ssh_key",
        python_callable=generate_ssh_key,
        op_args=[
            "{{ ti.xcom_pull(task_ids='create_terraform_dir') }}",
            "{{ ti.xcom_pull(task_ids='fetch_config')['repoName'] }}",
        ],
    )

    write_files_task = PythonOperator(
        task_id="write_terraform_files",
        python_callable=write_terraform_files,
        op_args=[
            "{{ ti.xcom_pull(task_ids='create_terraform_dir') }}",
            "{{ ti.xcom_pull(task_ids='fetch_config') }}",
            "{{ ti.xcom_pull(task_ids='generate_ssh_key') }}",
        ],
    )

    terraform_init = BashOperator(
        task_id="terraform_init",
        bash_command="cd {{ ti.xcom_pull(task_ids='create_terraform_dir') }} && terraform init",
    )

    # # Import RG if exists in Azure
    # terraform_import = BashOperator(
    #     task_id="terraform_import_rg",
    #     bash_command=(
    #         "cd {{ ti.xcom_pull(task_ids='create_terraform_dir') }} && "
    #         "terraform import -no-color "
    #         "azurerm_resource_group.rg "
    #         '"/subscriptions/$AZURE_SUBSCRIPTION_ID/resourceGroups/rg-{{ ti.xcom_pull(task_ids=\'fetch_config\')[\'repoName\'] }}-{{ ti.xcom_pull(task_ids=\'fetch_config\')[\'resourcesId\'][:4] }}" || true'
    #     ),
    #     env={
    #         "AZURE_SUBSCRIPTION_ID": os.getenv("AZURE_SUBSCRIPTION_ID", ""),
    #     }
    # )

    terraform_apply = BashOperator(
        task_id="terraform_apply",
        bash_command="cd {{ ti.xcom_pull(task_ids='create_terraform_dir') }} && terraform apply -auto-approve",
    )

    fetch_task >> create_dir_task >> generate_ssh_task >> write_files_task >> terraform_init >> terraform_apply
