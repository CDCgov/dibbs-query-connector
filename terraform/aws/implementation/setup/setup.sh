#!/bin/bash

WORKSPACE=tfstate

# write a function with aruments to set the backend
set_backend () {
    region=$(grep "region" "$WORKSPACE.tfvars" | cut -d'=' -f2 | tr -d ' "')
    owner=$(grep "owner" "$WORKSPACE.tfvars" | cut -d'=' -f2 | tr -d ' "')
    project=$(grep "project" "$WORKSPACE.tfvars" | cut -d'=' -f2 | tr -d ' "')
cat > backend.tf <<EOF
terraform {
  backend "$1" {}
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "=5.70.0"
    }
  }
}
provider "aws" {
  region = "$region"
  default_tags {
    tags = {
      owner       = "$owner"
      environment = "$WORKSPACE"
      project     = "$project"
    }
  }
}
EOF
}

if [ -f .env ]; then
    export $(cat .env | xargs)
    USE_S3_BACKEND=true
else
    read -p "Is this your first time running this script? [Yy]: " script_choice
    script_choice=$script_choice
    if [[ "$script_choice" =~ ^[Yy]$ ]]; then
        echo "Running terraform with a local backend. After this terraform is applied, we will automatically set up your s3 backend and push your terraform state."
        USE_S3_BACKEND=false
    else
        echo "Cannot find .env file. Please create a .env file with the following variables: BUCKET, DYNAMODB_TABLE, REGION."
        exit 1
    fi
fi

if [ -z "$WORKSPACE" ]; then
    echo "Missing required arguments. Please provide all the required arguments."
    ./setup.sh -h
    exit 1
fi

if ! command -v terraform &> /dev/null; then
    echo "Terraform is not installed. Please install Terraform."
    exit 1
fi

if [ ! -f "$WORKSPACE.tfvars" ]; then
    echo "Creating $WORKSPACE.tfvars"
    touch "$WORKSPACE.tfvars"
fi

if ! grep -q "owner" "$WORKSPACE.tfvars"; then
    read -p "Who is the owner of this infrastructure? ( default=skylight ): " owner_choice
    owner_choice=${owner_choice:-skylight}
    echo "owner = \"$owner_choice\"" >> "$WORKSPACE.tfvars"
fi

if ! grep -q "project" "$WORKSPACE.tfvars"; then
    read -p "What is this project called? ( default=dibbs ): " project_choice
    project_choice=${project_choice:-dibbs}
    echo "project = \"$project_choice\"" >> "$WORKSPACE.tfvars"
fi

if ! grep -q "region" "$WORKSPACE.tfvars"; then
    read -p "What aws region are you setting up in? ( default=us-east-1 ): " region_choice
    region_choice=${region_choice:-us-east-1}
    echo "region = \"$region_choice\"" >> "$WORKSPACE.tfvars"
fi

if ! grep -q "oidc_github_repo" "$WORKSPACE.tfvars"; then
    read -p "Do you want to setup a GitHub OIDC role? (y/n): " github_choice
    if [[ "$github_choice" =~ ^[Yy]$ ]]; then
        read -p "What is the organization/repo value for assume role? ( default=\"\" ): " repo_choice
        repo_choice=${repo_choice:-""}
        echo "oidc_github_repo = \"$repo_choice\"" >> "$WORKSPACE.tfvars"
    fi
fi

echo "Running Terraform with the following variables:"
cat "$WORKSPACE.tfvars"

if [ "$USE_S3_BACKEND" == "true" ]; then
    terraform init \
        -var-file="$WORKSPACE.tfvars" \
        -backend-config "encrypt=true" \
        -backend-config "key=setup_tfstate" \
        -backend-config "bucket=$BUCKET" \
        -backend-config "dynamodb_table=$DYNAMODB_TABLE" \
        -backend-config "region=$REGION"
else
    set_backend "local"
    terraform init -var-file="$WORKSPACE.tfvars"
fi

# Check if workspace exists
if terraform workspace list | grep -q "$WORKSPACE"; then
    echo "Selecting $WORKSPACE terraform workspace"
    terraform workspace select "$WORKSPACE"
else
    echo "Creating '$WORKSPACE' terraform workspace"
    terraform workspace new "$WORKSPACE"
fi

terraform apply -var-file="$WORKSPACE.tfvars"

if [ "$USE_S3_BACKEND" == "false" ]; then
    echo "Setting up your s3 terraform backend"
    if [ -f .env ]; then
        export $(cat .env | xargs)
    fi
    set_backend "s3"
    terraform init \
        -var-file="$WORKSPACE.tfvars" \
        -migrate-state \
        -backend-config "encrypt=true" \
        -backend-config "key=setup_tfstate" \
        -backend-config "bucket=$BUCKET" \
        -backend-config "dynamodb_table=$DYNAMODB_TABLE" \
        -backend-config "region=$REGION" \
        || (echo "terraform init failed, exiting..." && exit 1)
fi
