resource "aws_acm_certificate" "cloudflare_cert" {
  private_key      = var.qc_tls_key  # Private key from Cloudflare
  certificate_body = var.qc_tls_cert # Public cert from Cloudflare
}

data "aws_caller_identity" "current" {}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.16.0"

  name            = local.vpc_name
  cidr            = var.vpc_cidr
  azs             = var.availability_zones
  private_subnets = var.private_subnets
  public_subnets  = var.public_subnets
  # if internal is true, then the VPC will not have a NAT or internet gateway
  enable_nat_gateway = var.internal ? false : true
  single_nat_gateway = var.internal ? false : true
  create_igw         = var.internal ? false : true
  tags               = local.tags
}

module "ecs" {
  # source  = "CDCgov/dibbs-ecr-viewer/aws"
  # version = "0.3.0"
  source             = "git::https://github.com/CDCgov/terraform-aws-dibbs-ecr-viewer.git?ref=1df03178a66bcbeef430eae7e35b9bea6d98857a"
  public_subnet_ids  = flatten(module.vpc.public_subnets)
  private_subnet_ids = flatten(module.vpc.private_subnets)
  vpc_id             = module.vpc.vpc_id
  region             = var.region

  owner   = var.owner
  project = var.project
  tags    = local.tags


  phdi_version = "main"

  service_data = {
    query-connector = {
      root_service      = true,
      listener_priority = 3,
      short_name        = "qc",
      fargate_cpu       = 512,
      fargate_memory    = 1024,
      min_capacity      = 1,
      max_capacity      = 5,
      app_repo          = "ghcr.io/cdcgov/dibbs-query-connector",
      app_image         = "${terraform.workspace}-query-connector",
      app_version       = "main",
      container_port    = 3000,
      host_port         = 3000,
      public            = true,
      registry_url      = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.region}.amazonaws.com",
      env_vars = [
        {
          name  = "AWS_REGION",
          value = var.region
        },
        {
          name  = "HOSTNAME",
          value = "0.0.0.0"
        },
        {
          name  = "fhir_url"
          value = var.fhir_url
        },
        {
          name  = "cred_manager"
          value = var.cred_manager
        },
        {
          name  = "DATABASE_URL"
          value = "postgresql://${aws_db_instance.qc_db.username}:${aws_db_instance.qc_db.password}@${aws_db_instance.qc_db.endpoint}/${aws_db_instance.qc_db.db_name}"
        },
        {
          name  = "FLYWAY_URL"
          value = "jdbc:postgresql://${aws_db_instance.qc_db.endpoint}/${aws_db_instance.qc_db.db_name}"

        },
        {
          name  = "FLYWAY_PASSWORD"
          value = aws_db_instance.qc_db.password
        },
        {
          name  = "FLYWAY_USER"
          value = aws_db_instance.qc_db.username
        },
        {
          name  = "UMLS_API_KEY"
          value = var.umls_api_key
        },
        {
          name  = "ERSD_API_KEY"
          value = var.ersd_api_key
        },
        {
          name  = "AUTH_SECRET"
          value = var.auth_secret
        },
        {
          name  = "AUTH_KEYCLOAK_ID"
          value = var.keycloak_client_id
        },
        {
          name  = "AUTH_KEYCLOAK_SECRET"
          value = var.keycloak_client_secret
        },
        {
          name  = "AUTH_KEYCLOAK_ISSUER"
          value = var.auth_keycloak_issuer
        },
        {
          name  = "AUTH_URL"
          value = var.auth_url
        }
      ]
    },
    keycloak = {
      root_service      = false,
      listener_priority = 1,
      short_name        = "kc",
      fargate_cpu       = 512,
      fargate_memory    = 1024,
      min_capacity      = 1,
      max_capacity      = 5,
      app_repo          = "ghcr.io/cdcgov/dibbs-query-connector",
      app_image         = "${terraform.workspace}-keycloak",
      app_version       = "main",
      container_port    = 8080,
      host_port         = 8080,
      public            = true,
      registry_url      = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.region}.amazonaws.com",
      env_vars = [
        {
          name  = "KC_HTTP_RELATIVE_PATH"
          value = "/keycloak"
        },
        {
          name  = "KC_PROXY_HEADERS"
          value = "xforwarded"
        },
        {
          name  = "ENVIRONMENT"
          value = terraform.workspace
        }
      ]
    },
    aidboxone = {
      root_service      = false,
      listener_priority = 2,
      short_name        = "ab",
      fargate_cpu       = 512,
      fargate_memory    = 1024,
      min_capacity      = 1,
      max_capacity      = 5,
      # Use Docker Hub for app_repo
      app_repo       = "docker.io/healthsamurai",
      app_image      = "${terraform.workspace}-aidbox",
      app_version    = "edge",
      container_port = 8080,
      host_port      = 8080,
      public         = true,
      registry_url   = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.region}.amazonaws.com",
      env_vars = [
        {
          name  = "AIDBOX_TERMINOLOGY_SERVICE_BASE_URL"
          value = "https://tx.fhir.org/r4"
        },
        {
          name  = "AIDBOX_FHIR_PACKAGES"
          value = "hl7.fhir.r4.core#4.0.1"
        },
        {
          name  = "AIDBOX_FHIR_SCHEMA_VALIDATION"
          value = "true"
        },
        {
          name  = "AIDBOX_CREATED_AT_URL"
          value = "https://aidbox.app/ex/createdAt"
        },
        {
          name  = "AIDBOX_CLIENT_SECRET"
          value = var.aidbox_client_secret
        },
        {
          name  = "AIDBOX_CORRECT_AIDBOX_FORMAT"
          value = "true"
        },
        {
          name  = "AIDBOX_ADMIN_PASSWORD"
          value = var.aidbox_admin_password
        },
        {
          name  = "AIDBOX_COMPLIANCE"
          value = "enabled"
        },
        {
          name  = "AIDBOX_SECURITY_AUDIT__LOG_ENABLED"
          value = "true"
        },
        {
          name  = "BOX_SEARCH_FHIR__COMPARISONS"
          value = "true"
        },
        {
          name  = "PGHOST"
          value = aws_db_instance.qc_db.endpoint
        },
        {
          name  = "BOX_COMPATIBILITY_VALIDATION_JSON__SCHEMA_REGEX"
          value = "#{:fhir-datetime}"
        },
        {
          name  = "BOX_SEARCH_AUTHORIZE_INLINE_REQUESTS"
          value = "true"
        },
        {
          name  = "PGUSER"
          value = aws_db_instance.qc_db.username
        },
        {
          name  = "AIDBOX_PORT"
          value = "8080"
        },
        {
          name  = "PGDATABASE"
          value = "aidbox"
        },
        {
          name  = "PGPASSWORD"
          value = aws_db_instance.qc_db.password
        },
        {
          name  = "PGPORT"
          value = "5432"
        },
        {
          name  = "BOX_SEARCH_INCLUDE_CONFORMANT"
          value = "true"
        }
      ]
    }

  }


  # If intent is to pull from the phdi GHCR, set disable_ecr to true (default is false)
  # disable_ecr = true

  # If the intent is to make the ecr-viewer availabble on the public internet, set internal to false (default is true)
  # This requires an internet gateway to be present in the VPC.
  internal = var.internal

  # If the intent is to enable https and port 443, pass the arn of the cert in AWS certificate manager. This cert will be applied to the load balancer. (default is "")
  certificate_arn = aws_acm_certificate.cloudflare_cert.arn

  # If the intent is to disable authentication, set ecr_viewer_app_env to "test" (default is "prod")
  # ecr_viewer_app_env = "test"

  # To disable autoscaling, set enable_autoscaling to false (default is true)
  enable_autoscaling = false

  # If intent is to use a metadata database for polutating the ecr-viewer library, setup the database data object to connect to the database (supported databases are postgres and sqlserver)
  # Postgresql database example
  # postgres_database_data = {
  #   non_integrated_viewer = "true"
  #   metadata_database_type = "postgres"
  #   metadata_database_schema = "core" # (core or extended)
  #   secrets_manager_postgres_database_url_name = "prod/testSecret"
  # }
  # SqlServer database example
  # sqlserver_database_data = {
  #   non_integrated_viewer = "true"
  #   metadata_database_type = "sqlserver"
  #   metadata_database_schema = "core" # (core or extended)
  #   secrets_manager_sqlserver_user_name = "prod/testSecret"
  #   secrets_manager_sqlserver_password_name = "prod/testSecret"
  #   secrets_manager_sqlserver_host_name = "prod/testSecret"
  # }
}


resource "aws_db_instance" "qc_db" {
  allocated_storage               = "10"
  db_name                         = "${var.qc_db_name}_${terraform.workspace}"
  identifier                      = "${var.db_identifier}-${terraform.workspace}"
  engine                          = var.db_engine_type
  engine_version                  = var.db_engine_version
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  instance_class                  = var.db_instance_class
  username                        = var.db_username
  password                        = random_password.setup_rds_password.result
  parameter_group_name            = aws_db_parameter_group.this.name
  skip_final_snapshot             = true
  db_subnet_group_name            = aws_db_subnet_group.this.name
  vpc_security_group_ids          = [aws_security_group.db_sg.id]
}

# Create a DB subnet group
resource "aws_db_subnet_group" "this" {
  name       = "${var.db_identifier}-subnet-group-${terraform.workspace}"
  subnet_ids = module.vpc.private_subnets

}

# Create a parameter group to configure Postgres RDS parameters
resource "aws_db_parameter_group" "this" {
  name   = "${var.db_identifier}-pg-${terraform.workspace}"
  family = var.db_family

  parameter {
    name  = "log_connections"
    value = "1"
  }
  parameter {
    name  = "rds.force_ssl"
    value = "0"
  }
}

resource "aws_security_group" "db_sg" {
  vpc_id = module.vpc.vpc_id

  # Allow inbound traffic on port 5432 for PostgreSQL from within the VPC
  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["176.24.0.0/16"]
  }

  # Allow all outbound traffic
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.db_identifier}-security-group"
  }
}

# TODO: Update for Production to AWS Secrets Manager 
# This resource's attribute(s) default value is true 
resource "random_password" "setup_rds_password" {
  length = 13 #update as needed

  # Character set that excludes problematic characters like quotes, backslashes, etc.
  override_special = "[]{}"
}

# Create key pair for bastion
resource "aws_key_pair" "bastion" {
  key_name   = "bastion-key-${terraform.workspace}"
  public_key = var.bastion_public_key
}

data "http" "my_ip" {
  url = "https://api.ipify.org"
}

# Security group for bastion
resource "aws_security_group" "bastion" {
  name        = "bastion-sg-${terraform.workspace}"
  description = "Security group for bastion host"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = concat(var.bastion_allowed_ips, ["${data.http.my_ip.response_body}/32"])
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "bastion-sg-${terraform.workspace}"
  }
}

# Bastion host
resource "aws_instance" "bastion" {
  ami                         = "ami-053a45fff0a704a47" # Amazon Linux 2023 AMI
  instance_type               = "t3.nano"
  subnet_id                   = module.vpc.public_subnets[0]
  key_name                    = aws_key_pair.bastion.key_name
  associate_public_ip_address = true

  vpc_security_group_ids = [aws_security_group.bastion.id]

  user_data = <<-EOF
    #!/bin/bash
    dnf install -y postgresql15
  EOF

  tags = {
    Name = "bastion-${terraform.workspace}"
  }
}

# Update DB security group to allow access from bastion
resource "aws_security_group_rule" "allow_bastion" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.bastion.id
  security_group_id        = aws_security_group.db_sg.id
}

# Create private key file for bastion
resource "local_file" "bastion_private_key" {
  content         = var.bastion_private_key
  filename        = "${path.module}/bastion-key-${terraform.workspace}.pem"
  file_permission = "0600"
}

# Create the aidbox database using the bastion host
resource "null_resource" "create_aidbox_db" {
  triggers = {
    instance_id = aws_db_instance.qc_db.id
  }

  provisioner "local-exec" {
    command = <<-EOT
      echo "Waiting for bastion host to become available..."
      sleep 30
      chmod 600 ${local_file.bastion_private_key.filename}
      ssh -o StrictHostKeyChecking=no -i ${local_file.bastion_private_key.filename} \
          -L 5432:${aws_db_instance.qc_db.endpoint} \
          ec2-user@${aws_instance.bastion.public_ip} \
          "PGPASSWORD='${aws_db_instance.qc_db.password}' \
          psql -h localhost \
          -U ${aws_db_instance.qc_db.username} \
          -d ${aws_db_instance.qc_db.db_name} \
          -c 'CREATE DATABASE aidbox;'"
    EOT
  }

  depends_on = [
    aws_db_instance.qc_db,
    aws_instance.bastion
  ]
}
