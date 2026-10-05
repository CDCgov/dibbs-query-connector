data "azurerm_client_config" "current" {}

# Shared platform resources managed in skylight-hq/dibbs-tf-envs.
data "azurerm_resource_group" "global" {
  name = "skylight-dibbs-global"
}

data "azurerm_key_vault" "global" {
  name                = "skylightdibbsglobalkv"
  resource_group_name = data.azurerm_resource_group.global.name
}

data "azurerm_key_vault" "demo" {
  name                = "skylightdibbsdemokv"
  resource_group_name = data.azurerm_resource_group.global.name
}

data "azurerm_storage_account" "state" {
  name                = "dibbsstatestorage"
  resource_group_name = data.azurerm_resource_group.global.name
}

data "azurerm_resource_group" "hub" {
  name = "dibbs-global-demo"
}

data "azurerm_virtual_network" "hub" {
  name                = "dibbs-global-demo-hub-network"
  resource_group_name = data.azurerm_resource_group.hub.name
}
