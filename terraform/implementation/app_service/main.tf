

locals {
  qc_vault_name           = "qcdevkeyvault"                                # TODO: Change this to match the key vault that was created during Prerequisites
  qc_resource_group       = "qc-aca-rg"                                    # TODO: Change this to match the resource group that was created during Prerequisites
  location                = "East US 2"                                    # TODO: Change to match same as the resource group
  project                 = "qc"                                           #TODO: Change this to match naming convention that will be added to resources
  qc_docker_image_name    = "cdcgov/dibbs-query-connector/query-connector" #TODO: Change this if image name has been changed
  qc_docker_registry_name = "https://ghcr.io"                              #TODO: Change this if the image is not hosted in Github Container registry 
  fhir_url                = "undefined"
  cred_manager            = "undefined"
  umls_api_key            = "value"                                                 # TODO: Change to your UMLS API Key
  ersd_api_key            = "value"                                                 # TODO: Change to you ERSD API Key
  auth_provider           = "microsoft-entra-id"                                    # TODO
  auth_client_id          = "query-connector"                                       # TODO: "Client ID"
  auth_issuer             = "https://login.microsoftonline.com/your-tenant-id/v2.0" # TODO: URL for the Auth issuer for Entra (https://login.microsoftonline.com/<your-tenant-id>/v2.0 or keycloak)
  auth_url                = "http://localhost:3000"                                 # TODO: Change to URL for the Auth server
  entra_tenant_id         = "value"                                                 # TODO: Change to Tenant ID if using Entra
  database_name           = "qc_db"

}

data "azurerm_key_vault" "qc_key_vault" {
  name                = local.qc_vault_name
  resource_group_name = data.azurerm_resource_group.qc_rg.name
}

data "azurerm_resource_group" "qc_rg" {
  name = local.qc_resource_group
}



# VNet and Subnets [agw (Application Gateway),pe (Private Endpoints),pg (PostgreSQL), webapp (App Service)]

resource "azurerm_virtual_network" "vnet" {
  name                = "vnet-app"
  address_space       = ["10.0.0.0/16"]
  location            = local.location
  resource_group_name = data.azurerm_resource_group.qc_rg.name
}

resource "azurerm_subnet" "agw_subnet" {
  name                 = "agw-subnet"
  address_prefixes     = ["10.0.1.0/24"]
  virtual_network_name = azurerm_virtual_network.vnet.name
  resource_group_name  = data.azurerm_resource_group.qc_rg.name


  depends_on = [azurerm_virtual_network.vnet]
}

resource "azurerm_subnet" "pe_subnet" {
  name                 = "pe-subnet"
  address_prefixes     = ["10.0.2.0/24"]
  virtual_network_name = azurerm_virtual_network.vnet.name
  resource_group_name  = data.azurerm_resource_group.qc_rg.name

  depends_on = [azurerm_virtual_network.vnet]
}

resource "azurerm_subnet" "webapp_subnet" {
  name                 = "webapp-subnet"
  address_prefixes     = ["10.0.4.0/24"]
  virtual_network_name = azurerm_virtual_network.vnet.name
  resource_group_name  = data.azurerm_resource_group.qc_rg.name

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
  resource_group_name  = data.azurerm_resource_group.qc_rg.name

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
  name                          = "pgflexserver-${local.project}-${random_string.db_suffix.result}"
  location                      = local.location
  resource_group_name           = data.azurerm_resource_group.qc_rg.name
  administrator_login           = azurerm_key_vault_secret.query_connector_db_username.value
  administrator_password        = azurerm_key_vault_secret.query_connector_db_password.value
  version                       = "16"
  sku_name                      = "B_Standard_B1ms"
  storage_mb                    = 32768
  zone                          = "1"
  delegated_subnet_id           = azurerm_subnet.pg_subnet.id
  private_dns_zone_id           = azurerm_private_dns_zone.pg_dns.id
  public_network_access_enabled = "false"

}

resource "random_string" "db_suffix" {
  length  = 8
  upper   = false
  lower   = true
  numeric = true
  special = false
}


# PostgreSQL Flexible Database
resource "azurerm_postgresql_flexible_server_database" "qc_db" {
  name      = local.database_name
  server_id = azurerm_postgresql_flexible_server.postgres_qc.id

}

resource "azurerm_postgresql_flexible_server_configuration" "qc_db_configs" {
  name      = "azure.extensions"
  server_id = azurerm_postgresql_flexible_server.postgres_qc.id
  value     = "uuid-ossp"
}

# PostgreSQL Private DNS Zone
resource "azurerm_private_dns_zone" "pg_dns" {
  name                = "privatelink.postgres.database.azure.com"
  resource_group_name = data.azurerm_resource_group.qc_rg.name
}

resource "azurerm_private_dns_zone_virtual_network_link" "pg_link" {
  name                  = "pg-dns-link"
  resource_group_name   = data.azurerm_resource_group.qc_rg.name
  private_dns_zone_name = azurerm_private_dns_zone.pg_dns.name
  virtual_network_id    = azurerm_virtual_network.vnet.id

  depends_on = [azurerm_private_dns_zone.pg_dns]
}

# App Service Plan & Web App
resource "azurerm_service_plan" "plan" {
  name                = "appservice-plan-qc"
  location            = local.location
  resource_group_name = data.azurerm_resource_group.qc_rg.name
  os_type             = "Linux"
  sku_name            = "P1v2"

  depends_on = [data.azurerm_resource_group.qc_rg]
}

resource "random_string" "webapp_suffix" {
  length  = 6
  upper   = false
  special = false
}

resource "azurerm_linux_web_app" "webapp" {
  name                = "webapp-private-${local.project}-${random_string.webapp_suffix.result}"
  location            = local.location
  resource_group_name = data.azurerm_resource_group.qc_rg.name
  service_plan_id     = azurerm_service_plan.plan.id

  identity {
    type = "SystemAssigned"
  }
  site_config {
    application_stack {
      docker_image_name   = "${local.qc_docker_image_name}:${var.app_version}"
      docker_registry_url = "${local.qc_docker_registry_name}"
    }
    always_on                         = true
    health_check_path                 = "/"
    health_check_eviction_time_in_min = 2

  }

  app_settings = {

    fhir_url                  = local.fhir_url
    cred_manager              = local.cred_manager
    DATABASE_URL              = "postgres://${azurerm_key_vault_secret.query_connector_db_username.value}:${azurerm_key_vault_secret.query_connector_db_password.value}@${azurerm_postgresql_flexible_server.postgres_qc.fqdn}:5432/${local.database_name}?sslmode=require"
    FLYWAY_URL                = "jdbc:postgresql://${azurerm_postgresql_flexible_server.postgres_qc.fqdn}:5432/${local.database_name}"
    FLYWAY_PASSWORD           = "${azurerm_key_vault_secret.query_connector_db_password.value}"
    FLYWAY_USER               = "${azurerm_key_vault_secret.query_connector_db_username.value}"
    UMLS_API_KEY              = local.umls_api_key
    ERSD_API_KEY              = local.ersd_api_key
    NEXT_PUBLIC_AUTH_PROVIDER = local.auth_provider
    AUTH_SECRET               = "${azurerm_key_vault_secret.query_connector_auth_secret.value}"
    AUTH_CLIENT_ID            = local.auth_client_id
    AUTH_CLIENT_SECRET        = "${azurerm_key_vault_secret.query_connector_auth_client_secret.value}"
    AUTH_ISSUER               = local.auth_issuer
    ENTRA_TENANT_ID           = local.entra_tenant_id
    AUTH_DISABLED             = "true"
    AUTH_URL                  = local.auth_url
    WEBSITES_PORT             = "3000"
  }

  https_only = true
  depends_on = [data.azurerm_resource_group.qc_rg]
}

# Associate the App Service with the VNet:

resource "azurerm_app_service_virtual_network_swift_connection" "qc_app" {
  app_service_id = azurerm_linux_web_app.webapp.id
  subnet_id      = azurerm_subnet.webapp_subnet.id

}

# Private DNS Zone for App Service
resource "azurerm_private_dns_zone" "webapp_dns" {
  name                = "privatelink.azurewebsites.net"
  resource_group_name = data.azurerm_resource_group.qc_rg.name
}

resource "azurerm_private_dns_zone_virtual_network_link" "link" {
  name                  = "dns-link"
  resource_group_name   = data.azurerm_resource_group.qc_rg.name
  private_dns_zone_name = azurerm_private_dns_zone.webapp_dns.name
  virtual_network_id    = azurerm_virtual_network.vnet.id

  depends_on = [azurerm_private_dns_zone.webapp_dns]
}

# Private Endpoint for App Service
resource "azurerm_private_endpoint" "webapp_pe" {
  name                = "webapp-private-endpoint"
  location            = local.location
  resource_group_name = data.azurerm_resource_group.qc_rg.name
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
  resource_group_name = data.azurerm_resource_group.qc_rg.name
  allocation_method   = "Static"
  sku                 = "Standard"
}

# Application Gateway
resource "azurerm_application_gateway" "agw" {
  name                = "appgateway-qc"
  location            = local.location
  resource_group_name = data.azurerm_resource_group.qc_rg.name
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


# Creates secrets reference in App Service

resource "azurerm_key_vault_secret" "query_connector_db_username" {
  name         = "query-connector-db-user"
  value        = "qcdbuser"
  key_vault_id = data.azurerm_key_vault.qc_key_vault.id
}


resource "random_string" "db_password" {
  length           = 16
  special          = true
  override_special = "!*$"
}


resource "azurerm_key_vault_secret" "query_connector_db_password" {
  name         = "query-connector-db-password"
  value        = random_string.db_password.result
  key_vault_id = data.azurerm_key_vault.qc_key_vault.id
}

#Turn off comment if you want to me put API Keys in key vault
# resource "azurerm_key_vault_secret" "query_connector_umls_api_key" {
#   name         = "query-connector-umls-api-key"
#   key_vault_id = data.azurerm_key_vault.qc_key_vault.id
#   value        = var.umls_api_key
# }

# resource "azurerm_key_vault_secret" "query_connector_ersd_api_key" {
#   name         = "query-connector-ersd-api-key"
#   key_vault_id = data.azurerm_key_vault.qc_key_vault.id
#   value        = var.ersd_api_key
# }

resource "random_string" "auth_secret" {
  length           = 20
  special          = true
  override_special = "!*$"
}
resource "azurerm_key_vault_secret" "query_connector_auth_secret" {
  name         = "query-connector-auth-secret"
  key_vault_id = data.azurerm_key_vault.qc_key_vault.id
  value        = random_string.auth_secret.result
}

resource "random_string" "auth_client_secret" {
  length           = 20
  special          = true
  override_special = "!*$"
}

resource "azurerm_key_vault_secret" "query_connector_auth_client_secret" {
  name         = "query-connector-client-secret"
  key_vault_id = data.azurerm_key_vault.qc_key_vault.id
  value        = random_string.auth_client_secret.result
}