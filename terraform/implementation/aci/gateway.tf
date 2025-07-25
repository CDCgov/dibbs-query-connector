# since these variables are re-used - a locals block makes this more maintainable
locals {
  backend_address_pool_name      = "${azurerm_virtual_network.qc-vn.name}-beap"
  frontend_port_name             = "${azurerm_virtual_network.qc-vn.name}-feport"
  frontend_ip_configuration_name = "${azurerm_virtual_network.qc-vn.name}-feip"
  http_setting_name              = "${azurerm_virtual_network.qc-vn.name}-be-htst"
  listener_name                  = "${azurerm_virtual_network.qc-vn.name}-httplstn"
  request_routing_rule_name      = "${azurerm_virtual_network.qc-vn.name}-rqrt"
  redirect_configuration_name    = "${azurerm_virtual_network.qc-vn.name}-rdrcfg"
}


resource "azurerm_subnet" "gateway_subnet" {
  name                 = "appgw_subnet"
  resource_group_name  = var.resource_group
  virtual_network_name = azurerm_virtual_network.qc-vn.name
  address_prefixes     = ["10.0.4.0/24"]
}

resource "azurerm_public_ip" "static_gateway" {
  name                = "appgw-pip"
  resource_group_name = var.resource_group
  location            = var.location
  allocation_method   = "Static"
}

resource "azurerm_application_gateway" "appgw" {
  name                = "qc-appgateway"
  resource_group_name = var.resource_group
  location            = var.location

  sku {
    name     = "Standard_v2"
    tier     = "Standard_v2"
    capacity = 2
  }

  gateway_ip_configuration {
    name      = "qc-gateway-ip-configuration"
    subnet_id = azurerm_subnet.gateway_subnet.id
  }

  frontend_port {
    name = local.frontend_port_name
    port = 80
  }

  frontend_ip_configuration {
    name                 = local.frontend_ip_configuration_name
    public_ip_address_id = azurerm_public_ip.static_gateway.id
  }

  backend_address_pool {
    name = local.backend_address_pool_name
  }

  backend_http_settings {
    name                  = local.http_setting_name
    cookie_based_affinity = "Disabled"
    port                  = 80
    protocol              = "Http"
    request_timeout       = 60
  }

  http_listener {
    name                           = local.listener_name
    frontend_ip_configuration_name = local.frontend_ip_configuration_name
    frontend_port_name             = local.frontend_port_name
    protocol                       = "Http"
  }

  request_routing_rule {
    name                       = local.request_routing_rule_name
    priority                   = 9
    rule_type                  = "Basic"
    http_listener_name         = local.listener_name
    backend_address_pool_name  = local.backend_address_pool_name
    backend_http_settings_name = local.http_setting_name
  }
}