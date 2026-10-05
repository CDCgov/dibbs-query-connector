terraform {
  required_version = ">= 1.9"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }

  # Shared DIBBs state storage (owned by skylight-hq/dibbs-tf-envs global/).
  # Authenticates with the caller's Entra identity; no storage keys involved.
  backend "azurerm" {
    resource_group_name  = "skylight-dibbs-global"
    storage_account_name = "dibbsstatestorage"
    container_name       = "ce-tfstate"
    key                  = "query-connector/bootstrap.tfstate"
    use_azuread_auth     = true
  }
}

provider "azurerm" {
  features {}
  subscription_id     = var.subscription_id
  storage_use_azuread = true
}
