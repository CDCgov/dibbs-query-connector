
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.56.1" # Adjust based on your needs
    }
    random = {
      source  = "hashicorp/random"
      version = "3.6.3"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.2.0"
    }
    dockerless = {
      source  = "nullstone-io/dockerless"
      version = "0.1.1" # Specify a valid version
    }
    local = {
      source  = "hashicorp/local"
      version = "2.5.2"
    }
    http = {
      source  = "hashicorp/http"
      version = "3.4.5"
    }
  }


  backend "s3" {
    key     = "remote_tfstate"
    encrypt = true
    # dynamodb_table
    # bucket
    # region
  }
}

provider "aws" {
  region = "us-east-1"
  default_tags {
    tags = {
      owner       = var.owner
      environment = terraform.workspace
      project     = var.project
    }
  }
}
