import ast
import os
import json
import pika
import psycopg2
from dotenv import load_dotenv
from os.path import expanduser
from pathlib import Path
from datetime import datetime, timedelta
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

def fetch_from_database():
    # request_id = context['dag_run'].conf.get('request_id')
    request_id = "7525e163-7268-4aeb-ab1d-48787100d2d9"
    if not request_id:
        raise ValueError("No message received. Stop DAG run.")

    # Load environment variables
    load_dotenv(expanduser('/opt/airflow/dags/.env'))

    USER = os.getenv("DB_USER")
    PASSWORD = os.getenv("DB_PASSWORD")
    HOST = os.getenv("DB_HOST")
    PORT = os.getenv("DB_PORT")
    DBNAME = os.getenv("DB_NAME")

    print(f"Connecting to database {DBNAME} at {HOST}:{PORT} as user {USER}")

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
        'SELECT "resourcesId", "repositoryId" FROM "Request" WHERE id = %s;',
        (request_id,)
    )
    res = cursor.fetchone()
    if not res:
        raise ValueError(f"No request found for id={request_id}")
    resourcesId, repositoryId = res

    # ResourceConfigId
    cursor.execute(
        'SELECT "resourceConfigId" FROM "Resources" WHERE id = %s;',
        (resourcesId,)
    )
    row = cursor.fetchone()
    if not row:
        raise ValueError(f"No resource found for resourceConfigId={resourcesId}")
    resourceConfigId = row

    # ProjectName
    cursor.execute(
        'SELECT "name" FROM "Repository" WHERE id = %s;',
        (repositoryId,)
    )
    row = cursor.fetchone()
    if not row:
        raise ValueError(f"No repository found for id={repositoryId}")
    projectName = row[0]

    # awsInstanceType, instanceName, keyName, sgName
    cursor.execute(
        'SELECT "awsInstanceTypeId", "instanceName", "keyName", "sgName" '
        'FROM "AwsVMInstance" WHERE "resourceConfigId" = %s;',
        (resourceConfigId,)
    )
    vm_instances = cursor.fetchall()
    if not vm_instances:
        raise ValueError(f"No VM instance found for resourceConfigId={resourceConfigId}")
    print(f"VM Instances: {vm_instances}")
    # Shared values
    key_name = vm_instances[0][2]
    sg_name = vm_instances[0][3]

    instance_list = []
    for vm in vm_instances:
        awsInstanceTypeId, instanceName, keyName, sgName = vm
        cursor.execute(
            'SELECT "name" FROM "AwsInstanceType" WHERE id = %s;',
            (awsInstanceTypeId,)
        )
        row = cursor.fetchone()
        if not row:
            raise ValueError(f"No instance type found for id={awsInstanceTypeId}")
        instanceType = row[0]

        instance_list.append({
            "instance_name": instanceName,
            "instance_type": instanceType,
            "key_name": keyName,
            "sg_name": sgName
        })

    cursor.close()
    connection.close()

    configInfo = {
        "project_name": projectName,
        "sg_name": sg_name,
        "key_name": key_name,
        "region": "ap-southeast-1",
        "vm_instances": instance_list
    }
    return configInfo

def create_terraform_directory(configInfo):
    if isinstance(configInfo, str):
        import ast
        configInfo = ast.literal_eval(configInfo)
        
    projectName = configInfo['project_name']
    terraform_dir = f"/opt/airflow/dags/terraform/{projectName}/vm"
    os.makedirs(terraform_dir, exist_ok=True)
    print(f"[x] Created directory {terraform_dir}")
    return terraform_dir

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

def write_terraform_files(terraform_dir, configInfo, public_key_path):
    if isinstance(configInfo, str):
        import ast
        configInfo = ast.literal_eval(configInfo)
        
    config_dict = configInfo
    projectName = f"{config_dict['project_name']}"
    vm_resources = config_dict['vm_instances']
    key_name = config_dict['key_name']
    sg_name = config_dict['sg_name']

    load_dotenv(expanduser('/opt/airflow/dags/.env'))
     # terraform.auto.tfvars
    tfvars_content = f"""
    access_key      = "{os.getenv('AWS_ACCESS_KEY')}"
    secret_key           = "{os.getenv('AWS_SECRET_KEY')}"
    project_location     = "{config_dict['region']}"
    project_name         = "{projectName}"
    vm_instances = {json.dumps(vm_resources, indent=4)}
    """
    with open(f"{terraform_dir}/terraform.auto.tfvars", "w") as f:
        f.write(tfvars_content)

    main_tf_content = f"""
    terraform {{
    required_providers {{
        aws = {{
        source  = "hashicorp/aws"
        version = "~>5.0"
        }}
    }}
    }}

    provider "aws" {{
    region     = var.project_location
    access_key = var.access_key
    secret_key = var.secret_key
    }}


    data "aws_ami" "ubuntu2204" {{
    most_recent = true
    owners      = ["099720109477"] # Canonical

    filter {{
        name   = "name"
        values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
    }}
    }}

    # VPC
    resource "aws_vpc" "vpc" {{
    cidr_block = "10.0.0.0/16"
    tags = {{
        Name = "${{var.project_name}}-vm"
        }}
    }}

    data "aws_availability_zones" "available" {{}}

    # Subnet
    resource "aws_subnet" "subnet" {{
    vpc_id                  = aws_vpc.vpc.id
    cidr_block              = "10.0.1.0/24"
    availability_zone       = data.aws_availability_zones.available.names[0]
    map_public_ip_on_launch = true
    tags = {{
        Name = "${{var.project_name}}-vm"
        }}
    }}

    # Internet Gateway
    resource "aws_internet_gateway" "igw" {{
    vpc_id = aws_vpc.vpc.id
    tags = {{
        Name = "${{var.project_name}}-vm"
        }}
    }}

    # Route Table
    resource "aws_route_table" "rt" {{
    vpc_id = aws_vpc.vpc.id

    route {{
        cidr_block = "0.0.0.0/0"
        gateway_id = aws_internet_gateway.igw.id
    }}

    tags = {{
        Name = "${{var.project_name}}-vm"
        }}
    }}

    # Associate Route Table
    resource "aws_route_table_association" "rta" {{
    subnet_id      = aws_subnet.subnet.id
    route_table_id = aws_route_table.rt.id
    }}

    # Security Group
    resource "aws_security_group" "sg" {{
    name        = "{sg_name}"
    description = "Allow SSH and HTTP"
    vpc_id      = aws_vpc.vpc.id

    ingress {{
        from_port   = 22
        to_port     = 22
        protocol    = "tcp"
        cidr_blocks = ["0.0.0.0/0"]
    }}

    ingress {{
        from_port   = 80
        to_port     = 80
        protocol    = "tcp"
        cidr_blocks = ["0.0.0.0/0"]
    }}

    egress {{
        from_port   = 0
        to_port     = 0
        protocol    = "-1"
        cidr_blocks = ["0.0.0.0/0"]
    }}

    tags = {{
        Name = "${{var.project_name}}-vm"
        }}
    }}

    resource "aws_key_pair" "vm_key" {{
    key_name   = "{key_name}"
    public_key = file(var.ssh_public_key_path)
    }}

    resource "aws_instance" "vm" {{
    for_each               = {{for vm in var.vm_instances : vm.instance_name => vm }}
    ami                    = data.aws_ami.ubuntu2204.id
    instance_type          = each.value.instance_type
    subnet_id              = aws_subnet.subnet.id
    # Each VM can use its own SG if needed
    vpc_security_group_ids = [aws_security_group.sg.id]
    key_name               = aws_key_pair.vm_key.key_name

    tags = {{
        Name = "${{var.instance_name}}"
        }}
    }}


    # Output the public IP
    output "public_ip" {{
    value = {{ for name, inst in aws_instance.vm : name => inst.public_ip }}
    }}
    """

    with open(f"{terraform_dir}/main.tf", "w") as f:
        f.write(main_tf_content)
    
    load_dotenv(expanduser('/opt/airflow/dags/.env'))

    variables_tf = f"""
    variable "access_key" {{
    default = "{os.getenv('AWS_ACCESS_KEY')}"
    }}

    variable "secret_key" {{
    default = "{os.getenv('AWS_SECRET_KEY')}"
    }}

    variable "project_location" {{
    default = "{config_dict['region']}"
    }}

    variable "ssh_public_key_path" {{
    default = "{public_key_path}"
    }}

    variable "project_name" {{
    default = "{projectName}"
    }}

   variable "vm_instances" {{
    description = "List of VM configs"
    type = list(object({{
        instance_name = string
        instance_type = string
        key_name      = string
        sg_name       = string
    }}))
    }}

    """
    with open(f"{terraform_dir}/variables.tf", "w") as f:
        f.write(variables_tf)
    
    print(f"[x] Created Terraform files in {terraform_dir}")

with DAG(
    'AWS_terraform_vm_provision',
    default_args=default_args,
    schedule_interval=None,
    catchup=False,
) as dag:

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
            "{{ ti.xcom_pull(task_ids='fetch_config')['project_name'] }}",
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

    terraform_apply = BashOperator(
        task_id="terraform_apply",
        bash_command="cd {{ ti.xcom_pull(task_ids='create_terraform_dir') }} && terraform apply -auto-approve",
    )

    fetch_task >> create_dir_task >> generate_ssh_task >> write_files_task >> terraform_init >> terraform_apply
