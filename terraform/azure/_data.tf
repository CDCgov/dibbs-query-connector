# Resources created by terraform/bootstrap.
data "azurerm_resource_group" "qc" {
  name = var.resource_group_name
}

# Shared platform resources managed in skylight-hq/dibbs-tf-envs.
data "azurerm_resource_group" "global" {
  name = "skylight-dibbs-global"
}

data "azurerm_virtual_network" "hub" {
  name                = "dibbs-global-demo-hub-network"
  resource_group_name = "dibbs-global-demo"
}

data "azurerm_postgresql_flexible_server" "global" {
  name                = "dibbs-global-postgres"
  resource_group_name = data.azurerm_resource_group.global.name
}

data "azurerm_key_vault" "global" {
  name                = "skylightdibbsglobalkv"
  resource_group_name = data.azurerm_resource_group.global.name
}

data "azurerm_key_vault" "demo" {
  name                = "skylightdibbsdemokv"
  resource_group_name = data.azurerm_resource_group.global.name
}

# Secrets are managed out of band in Key Vault (see README.md for the list).
locals {
  global_vault_secrets = {
    db_user            = "query-connector-demo-db-user"
    db_password        = "query-connector-demo-db-password"
    entra_tenant_id    = "query-connector-demo-azuread-tenant-id"
    auth_client_id     = "query-connector-demo-client-id"
    auth_client_secret = "query-connector-demo-client-secret"
  }

  demo_vault_secrets = {
    umls_api_key          = "query-connector-umls-api-key"
    ersd_api_key          = "query-connector-ersd-api-key"
    auth_secret           = "query-connector-auth-secret"
    aidbox_license        = "query-connector-aidbox-license"
    aidbox_client_secret  = "query-connector-aidbox-client-secret"
    aidbox_admin_password = "query-connector-aidbox-admin-password"
    aidbox_db_user        = "query-connector-aidbox-db-user"
    aidbox_db_password    = "query-connector-aidbox-db-password"
  }
}

data "azurerm_key_vault_secret" "global" {
  for_each = local.global_vault_secrets

  name         = each.value
  key_vault_id = data.azurerm_key_vault.global.id
}

data "azurerm_key_vault_secret" "demo" {
  for_each = local.demo_vault_secrets

  name         = each.value
  key_vault_id = data.azurerm_key_vault.demo.id
}
