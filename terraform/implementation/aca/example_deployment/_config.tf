terraform {
  backend "azurerm" {
    resource_group_name  = "<INSERT_STORAGE_RG_HERE>"
    storage_account_name = "dibbsstatestorage"
    container_name       = "ce-tfstate"
    key                  = "dev/terraform.tfstate"
  }
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.116.0"
    }
  }
  required_version = "~> 1.7.4"
}

provider "azurerm" {
  features {}
  skip_provider_registration = true
}