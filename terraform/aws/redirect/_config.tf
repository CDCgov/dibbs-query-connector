terraform {
  required_version = ">= 1.9"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }

  # State lives with the rest of the Query Connector state in the shared DIBBs
  # storage account (owned by skylight-hq/dibbs-tf-envs global/), so applying
  # needs `az login` as well as AWS credentials.
  backend "azurerm" {
    resource_group_name  = "skylight-dibbs-global"
    storage_account_name = "dibbsstatestorage"
    container_name       = "ce-tfstate"
    key                  = "query-connector/queryconnector-dev-redirect.tfstate"
    use_azuread_auth     = true
  }
}

# CloudFront only accepts ACM certificates from us-east-1.
provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = var.tags
  }
}
