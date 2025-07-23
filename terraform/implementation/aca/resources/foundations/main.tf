resource "azurerm_resource_group" "rg" {
  name     = "${var.team}-${var.project}-${var.env}"
  location = var.location

  lifecycle {
    ignore_changes = [
      tags
    ]
  }
}

resource "azurerm_container_registry" "acr" {
  location            = var.location
  name                = "${var.team}${var.project}${var.env}acr"
  resource_group_name = azurerm_resource_group.rg.name
  sku                 = "Standard"
  admin_enabled       = true
}

resource "azurerm_storage_account" "app" {
  account_replication_type         = "GRS" # Cross-regional redundancy
  account_tier                     = "Standard"
  account_kind                     = "StorageV2"
  name                             = "${var.team}${var.project}${var.env}sa"
  resource_group_name              = azurerm_resource_group.rg.name
  location                         = var.location
  https_traffic_only_enabled       = true
  min_tls_version                  = "TLS1_2"
  allow_nested_items_to_be_public  = false
  cross_tenant_replication_enabled = false
}

resource "azurerm_storage_container" "ecr_data" {
  name                  = "ecr-data"
  storage_account_name  = azurerm_storage_account.app.name
  container_access_type = "private"
}