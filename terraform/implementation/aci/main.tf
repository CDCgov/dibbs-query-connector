
locals {
  env = "dev"
}

data "azurerm_key_vault" "qc_key_vault" {
  name                = "qcdevkeyvault"
  resource_group_name = data.azurerm_resource_group.aci.name
}

data "azurerm_resource_group" "aci" {
  name = var.resource_group
}

#Uncomment if you want to create a registry to pull image from instead of pulling from Query Connector's repo

# resource "azurerm_container_registry" "aci" {
#   name                     = "myacr"
#   resource_group_name      = azurerm_resource_group.aci.name
#   location                 = azurerm_resource_group.aci.location
#   sku                      = "Basic"
#   admin_enabled            = true
#   georeplication_locations = ["eastus2"]
# }

resource "azurerm_virtual_network" "qc-vn" {
  name                = "qc-vn"
  location            = var.location
  resource_group_name = var.resource_group
  address_space       = ["10.0.0.0/16"]
}
resource "azurerm_subnet" "qc-aci-subnet" {
  name                 = "qc-aci-subnet"
  resource_group_name  = data.azurerm_resource_group.aci.name
  virtual_network_name = azurerm_virtual_network.qc-vn.name
  address_prefixes     = ["10.0.3.0/24"]
  service_endpoints    = ["Microsoft.KeyVault"]
  delegation {
    name = "aciDelegation"
    service_delegation {
      name = "Microsoft.ContainerInstance/containerGroups"
      actions = [
        "Microsoft.Network/virtualNetworks/subnets/join/action",
      ]
    }
  }
}
#Creates the Container App Instance
resource "azurerm_container_group" "aci" {
  name                = "qccontainergroup"
  location            = var.location
  resource_group_name = var.resource_group
  subnet_ids          = [azurerm_subnet.qc-aci-subnet.id]
  os_type             = "Linux"
  ip_address_type     = "Private"

  container {
    name   = "query-connector"
    image  = "ghcr.io/cdcgov/dibbs-query-connector/query-connector:${var.app_version}"
    cpu    = 0.5
    memory = 1.5
    ports {
      port     = 3000
      protocol = "TCP"
    }

    environment_variables = {
      location = var.location
      # APP_HOSTNAME              = "connector.dibbs.tools"
      fhir_url                  = var.fhir_url
      cred_manager              = var.cred_manager
      DATABASE_URL              = "postgres://${azurerm_key_vault_secret.query_connector_db_username.value}:${azurerm_key_vault_secret.query_connector_db_password.value}@${azurerm_postgresql_flexible_server.qc-db.fqdn}:${var.database_port}/${azurerm_postgresql_flexible_server.qc-db.name}?sslmode=require"
      FLYWAY_URL                = "jdbc:postgresql://${azurerm_postgresql_flexible_server.qc-db.fqdn}:5432/${azurerm_postgresql_flexible_server.qc-db.name}"
      FLYWAY_PASSWORD           = "${azurerm_key_vault_secret.query_connector_db_password.value}"
      FLYWAY_USER               = "${azurerm_key_vault_secret.query_connector_db_username.value}"
      UMLS_API_KEY              = var.umls_api_key
      ERSD_API_KEY              = var.ersd_api_key
      NEXT_PUBLIC_AUTH_PROVIDER = var.auth_provider
      AUTH_SECRET               = "${azurerm_key_vault_secret.query_connector_auth_secret.value}"
      AUTH_CLIENT_ID            = var.auth_client_id
      # AUTH_CLIENT_SECRET        = "${azurerm_key_vault_secret.query_connector_auth_client_secret.value}"
      AUTH_ISSUER     = var.auth_issuer
      ENTRA_TENANT_ID = var.entra_tenant_id
      AUTH_DISABLED   = "true"
      # AUTH_URL                  = "https://connector.dibbs.tools"
    }
  }

}


#Creates Postgres Flexible server and dependencies



resource "azurerm_subnet" "qc-subnet" {
  name                 = "qc-postgres-subnet"
  resource_group_name  = data.azurerm_resource_group.aci.name
  virtual_network_name = azurerm_virtual_network.qc-vn.name
  address_prefixes     = ["10.0.2.0/24"]
  service_endpoints    = ["Microsoft.Storage"]
  delegation {
    name = "fs"
    service_delegation {
      name = "Microsoft.DBforPostgreSQL/flexibleServers"
      actions = [
        "Microsoft.Network/virtualNetworks/subnets/join/action",
      ]
    }
  }
}
resource "azurerm_private_dns_zone" "qc-dns-zone" {
  name                = "qc.postgres.database.azure.com"
  resource_group_name = data.azurerm_resource_group.aci.name
}

resource "azurerm_private_dns_zone_virtual_network_link" "qc-network-link" {
  name                  = "qcVnetZone.com"
  private_dns_zone_name = azurerm_private_dns_zone.qc-dns-zone.name
  virtual_network_id    = azurerm_virtual_network.qc-vn.id
  resource_group_name   = data.azurerm_resource_group.aci.name
  depends_on            = [azurerm_subnet.qc-subnet]
}

resource "azurerm_postgresql_flexible_server" "qc-db" {
  name                          = "qc-psqlflexibleserver"
  resource_group_name           = var.resource_group
  location                      = var.location
  version                       = "16"
  delegated_subnet_id           = azurerm_subnet.qc-subnet.id
  private_dns_zone_id           = azurerm_private_dns_zone.qc-dns-zone.id
  public_network_access_enabled = false
  administrator_login           = azurerm_key_vault_secret.query_connector_db_username.value
  administrator_password        = azurerm_key_vault_secret.query_connector_db_password.value
  zone                          = "1"

  storage_mb   = 32768
  storage_tier = "P4"

  sku_name   = "B_Standard_B1ms"
  depends_on = [azurerm_private_dns_zone_virtual_network_link.qc-network-link]

}

#Creates secrets referenced in Container App Instance


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

resource "azurerm_key_vault_secret" "query_connector_umls_api_key" {
  name         = "query-connector-umls-api-key"
  key_vault_id = data.azurerm_key_vault.qc_key_vault.id
  value        = var.umls_api_key
}

resource "azurerm_key_vault_secret" "query_connector_ersd_api_key" {
  name         = "query-connector-ersd-api-key"
  key_vault_id = data.azurerm_key_vault.qc_key_vault.id
  value        = var.ersd_api_key
}


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

resource "azurerm_key_vault_secret" "query_connector_auth_client_id" {
  name         = "query-connector-${local.env}-client-id"
  key_vault_id = data.azurerm_key_vault.qc_key_vault.id
  value        = var.auth_client_id
}


# resource "azurerm_key_vault_secret" "query_connector_auth_client_secret" {
#   name         = "query-connector-${local.env}-client-secret"
#   key_vault_id = data.azurerm_key_vault.qc_key_vault.id
# }