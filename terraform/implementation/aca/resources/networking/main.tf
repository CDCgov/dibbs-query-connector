locals {
  name = "${var.team}-${var.project}-${var.env}"
}

resource "azurerm_virtual_network" "vnet" {
  name                = "${local.name}-network"
  resource_group_name = var.resource_group_name
  location            = var.location
  address_space       = var.network_address_space
}

resource "azurerm_subnet" "appgw" {
  name                 = "${local.name}-appgw-subnet"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = var.app_gateway_subnet_address_prefixes
  service_endpoints = [
    "Microsoft.Web",
    "Microsoft.Storage",
    "Microsoft.KeyVault"
  ]
}

resource "azurerm_subnet" "aca" {
  name                 = "${local.name}-aca"
  resource_group_name  = var.resource_group_name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = var.aca_subnet_address_prefixes
  service_endpoints = [
    "Microsoft.KeyVault"
  ]

  delegation {
    name = "aca_delegation"

    service_delegation {
      name    = "Microsoft.App/environments"
      actions = ["Microsoft.Network/virtualNetworks/subnets/join/action"]
    }
  }
}
