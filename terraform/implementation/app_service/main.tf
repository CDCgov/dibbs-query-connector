terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.116.0"
    }
  }
  required_version = ">= 1.4"
}

provider "azurerm" {
  features {}
}

locals {
  location        = "Canada Central"
  postgres_user   = "pgadmin"
  postgres_pass   = "MySecureP@ss123"
  docker_image    = "yourdockerhubuser/yourapp:latest"
  fhir_url        = "undefined"
  cred_manager    = "undefined"
  umls_api_key    = "value"
  ersd_api_key    = "value"
  auth_provider   = "microsoft-entra-id"
  auth_client_id  = "query-connector"
  auth_issuer     = "https://login.microsoftonline.com/your-tenant-id/v2.0"
  entra_tenant_id = "value"
  database_name   = "qc_db"

}



resource "azurerm_resource_group" "rg" {
  name     = "rg-appservice-agw-private"
  location = local.location
}

# VNet and Subnets
resource "azurerm_virtual_network" "vnet" {
  name                = "vnet-app"
  address_space       = ["10.0.0.0/16"]
  location            = local.location
  resource_group_name = azurerm_resource_group.rg.name
}

resource "azurerm_subnet" "agw_subnet" {
  name                 = "agw-subnet"
  address_prefixes     = ["10.0.1.0/24"]
  virtual_network_name = azurerm_virtual_network.vnet.name
  resource_group_name  = azurerm_resource_group.rg.name


  depends_on = [azurerm_virtual_network.vnet]
}

resource "azurerm_subnet" "pe_subnet" {
  name                 = "pe-subnet"
  address_prefixes     = ["10.0.2.0/24"]
  virtual_network_name = azurerm_virtual_network.vnet.name
  resource_group_name  = azurerm_resource_group.rg.name

  depends_on = [azurerm_virtual_network.vnet]
}

resource "azurerm_subnet" "webapp_subnet" {
  name                 = "webapp-subnet"
  address_prefixes     = ["10.0.4.0/24"]
  virtual_network_name = azurerm_virtual_network.vnet.name
  resource_group_name  = azurerm_resource_group.rg.name

  delegation {
    name = "webAppDelegation"
    service_delegation {
      name    = "Microsoft.Web/serverFarms"
      actions = ["Microsoft.Network/virtualNetworks/subnets/action"]
    }
  }
  depends_on = [azurerm_virtual_network.vnet]

}

resource "azurerm_subnet" "pg_subnet" {
  name                 = "pg-subnet"
  address_prefixes     = ["10.0.3.0/24"]
  virtual_network_name = azurerm_virtual_network.vnet.name
  resource_group_name  = azurerm_resource_group.rg.name

  delegation {
    name = "pgDelegation"
    service_delegation {
      name    = "Microsoft.DBforPostgreSQL/flexibleServers"
      actions = ["Microsoft.Network/virtualNetworks/subnets/join/action"]
    }
  }

  depends_on = [azurerm_virtual_network.vnet]
}

# PostgreSQL Flexible Server
resource "azurerm_postgresql_flexible_server" "postgres_qc" {
  name                          = "pgflexserverdemo"
  location                      = local.location
  resource_group_name           = azurerm_resource_group.rg.name
  administrator_login           = local.postgres_user
  administrator_password        = local.postgres_pass
  version                       = "16"
  sku_name                      = "B_Standard_B1ms"
  storage_mb                    = 32768
  zone                          = "1"
  delegated_subnet_id           = azurerm_subnet.pg_subnet.id
  private_dns_zone_id           = azurerm_private_dns_zone.pg_dns.id
  public_network_access_enabled = "false"

}

# PostgreSQL Flexible Database
resource "azurerm_postgresql_flexible_server_database" "qc_db" {
  name      = local.database_name
  server_id = azurerm_postgresql_flexible_server.postgres_qc.id

}


# PostgreSQL Private DNS Zone
resource "azurerm_private_dns_zone" "pg_dns" {
  name                = "privatelink.postgres.database.azure.com"
  resource_group_name = azurerm_resource_group.rg.name
}

resource "azurerm_private_dns_zone_virtual_network_link" "pg_link" {
  name                  = "pg-dns-link"
  resource_group_name   = azurerm_resource_group.rg.name
  private_dns_zone_name = azurerm_private_dns_zone.pg_dns.name
  virtual_network_id    = azurerm_virtual_network.vnet.id

  depends_on = [azurerm_private_dns_zone.pg_dns]
}

# App Service Plan & Web App
resource "azurerm_service_plan" "plan" {
  name                = "appservice-plan-qc"
  location            = local.location
  resource_group_name = azurerm_resource_group.rg.name
  os_type             = "Linux"
  sku_name            = "P1v2"

  depends_on = [azurerm_resource_group.rg]
}

resource "random_string" "webapp_suffix" {
  length  = 6
  upper   = false
  special = false
}

resource "azurerm_linux_web_app" "webapp" {
  name                = "webapp-private-demo-${random_string.webapp_suffix.result}"
  location            = local.location
  resource_group_name = azurerm_resource_group.rg.name
  service_plan_id     = azurerm_service_plan.plan.id

  identity {
    type = "SystemAssigned"
  }
  site_config {
    application_stack {
      docker_image_name   = "cdcgov/dibbs-query-connector/query-connector:${var.app_version}"
      docker_registry_url = "https://ghcr.io"
    }
    always_on                         = true
    health_check_path                 = "/"
    health_check_eviction_time_in_min = 2

  }

  app_settings = {
    #this will need to change but stay for testing purposes


    fhir_url                  = local.fhir_url
    cred_manager              = local.cred_manager
    DATABASE_URL              = "postgres://${local.postgres_user}:${local.postgres_pass}@${azurerm_postgresql_flexible_server.postgres_qc.fqdn}:5432/${local.database_name}?sslmode=require"
    FLYWAY_URL                = "jdbc:postgresql://${azurerm_postgresql_flexible_server.postgres_qc.fqdn}:5432/${local.database_name}"
    FLYWAY_PASSWORD           = "${local.postgres_pass}"
    FLYWAY_USER               = "${local.postgres_user}"
    UMLS_API_KEY              = local.umls_api_key
    ERSD_API_KEY              = local.ersd_api_key
    NEXT_PUBLIC_AUTH_PROVIDER = local.auth_provider
    AUTH_SECRET               = "1234455fjdkfjdllkskj"
    AUTH_CLIENT_ID            = local.auth_client_id
    # AUTH_CLIENT_SECRET        = "${data.azurerm_key_vault_secret.query_connector_auth_client_secret.value}"
    AUTH_ISSUER     = local.auth_issuer
    ENTRA_TENANT_ID = local.entra_tenant_id
    AUTH_DISABLED   = "true"
    # AUTH_URL                  = "https://connector.dibbs.tools"
    WEBSITES_PORT = "3000"
  }

  https_only = true
  depends_on = [azurerm_resource_group.rg]
}

# Associate the App Service with the VNet:

resource "azurerm_app_service_virtual_network_swift_connection" "qc_app" {
  app_service_id = azurerm_linux_web_app.webapp.id
  subnet_id      = azurerm_subnet.webapp_subnet.id
}

# Private DNS Zone for App Service
resource "azurerm_private_dns_zone" "webapp_dns" {
  name                = "privatelink.azurewebsites.net"
  resource_group_name = azurerm_resource_group.rg.name
}

resource "azurerm_private_dns_zone_virtual_network_link" "link" {
  name                  = "dns-link"
  resource_group_name   = azurerm_resource_group.rg.name
  private_dns_zone_name = azurerm_private_dns_zone.webapp_dns.name
  virtual_network_id    = azurerm_virtual_network.vnet.id

  depends_on = [azurerm_private_dns_zone.webapp_dns]
}

# Private Endpoint for App Service
resource "azurerm_private_endpoint" "webapp_pe" {
  name                = "webapp-private-endpoint"
  location            = local.location
  resource_group_name = azurerm_resource_group.rg.name
  subnet_id           = azurerm_subnet.pe_subnet.id

  private_service_connection {
    name                           = "webapp-privatesc"
    private_connection_resource_id = azurerm_linux_web_app.webapp.id
    subresource_names              = ["sites"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "webapp-dns-group"
    private_dns_zone_ids = [azurerm_private_dns_zone.webapp_dns.id]
  }
}

# Public IP for Application Gateway
resource "azurerm_public_ip" "agw_pip" {
  name                = "agw-public-ip"
  location            = local.location
  resource_group_name = azurerm_resource_group.rg.name
  allocation_method   = "Static"
  sku                 = "Standard"
}

# Application Gateway
resource "azurerm_application_gateway" "agw" {
  name                = "appgateway-demo"
  location            = local.location
  resource_group_name = azurerm_resource_group.rg.name
  sku {
    name     = "Standard_v2"
    tier     = "Standard_v2"
    capacity = 1
  }

  gateway_ip_configuration {
    name      = "gateway-ip-config"
    subnet_id = azurerm_subnet.agw_subnet.id
  }

  frontend_ip_configuration {
    name                 = "frontend-config"
    public_ip_address_id = azurerm_public_ip.agw_pip.id
  }

  frontend_port {
    name = "frontend-port"
    port = 80
  }

  backend_address_pool {
    name  = "backend-pool"
    fqdns = [azurerm_linux_web_app.webapp.default_hostname]

  }

  backend_http_settings {
    name                  = "http-settings"
    port                  = 80
    protocol              = "Http"
    cookie_based_affinity = "Disabled"
    host_name             = azurerm_linux_web_app.webapp.default_hostname
    probe_name            = "qc-health-probe"
  }

  probe {
    name                = "qc-health-probe"
    protocol            = "Http"
    path                = "/"
    host                = azurerm_linux_web_app.webapp.default_hostname
    interval            = 30
    timeout             = 60
    unhealthy_threshold = 3
  }
  http_listener {
    name                           = "http-listener"
    frontend_ip_configuration_name = "frontend-config"
    frontend_port_name             = "frontend-port"
    protocol                       = "Http"
  }

  request_routing_rule {
    name                       = "rule1"
    rule_type                  = "Basic"
    http_listener_name         = "http-listener"
    backend_address_pool_name  = "backend-pool"
    backend_http_settings_name = "http-settings"
    priority                   = 11
  }

  depends_on = [azurerm_private_endpoint.webapp_pe]
}
