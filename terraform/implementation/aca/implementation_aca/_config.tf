/*
 * The Terraform Azure backend requires a pre-existing Azure Storage Account and a container to store the state file. If you do not already
 * have a pre-configured resource for this, we recommend setting one up manually.
 * 
 * WARNING: Make sure you don't use the same resource group for your state storage and your DIBBs resources to avoid accidental deletion.
 *          DIBBs resources should be deployed in their own resource group.
 */
terraform {
  backend "azurerm" {
    resource_group_name  = "qc-aca-rg" // TODO: Change this to match the resource group that contains your storage account for Terraform state storage.
    storage_account_name = "qcacastorageaccount"     // TODO: Change this to match the storage account that contains/will contain your Terraform state files.
    container_name       = "tfstate"         // We recommend leaving this alone, to keep DIBBs state files separate from the rest of your resources.
    key                  = "dev/terraform.tfstate" // TODO: Change the prefix to match the environment you are working in.
  }
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.116.0"
    }
  }
  required_version = "~> 1.9.8"
}

provider "azurerm" {
  features {}
  skip_provider_registration = true
}