
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.62.0"  # Adjust based on your needs
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
      version = "0.1.1"  # Specify a valid version
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
