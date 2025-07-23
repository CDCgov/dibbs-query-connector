data "azurerm_client_config" "current" {}

# data "azurerm_key_vault" "global_key_vault" {
#   name                = "skylightdibbsglobalkv"
#   resource_group_name = "skylight-dibbs-global"
# }

data "azurerm_key_vault_secret" "query_connector_db_username" {
  name         = "query-connector-demo-db-user"
  key_vault_id = resource.azurerm_key_vault.kv.id
}

data "azurerm_key_vault_secret" "query_connector_db_password" {
  name         = "query-connector-demo-db-password"
  key_vault_id = resource.azurerm_key_vault.kv.id
}

# data "azurerm_key_vault" "demo_key_vault" {
#   name                = "skylightdibbsdemokv"
#   resource_group_name = "skylight-dibbs-global"
# }

data "azurerm_key_vault_secret" "query_connector_umls_api_key" {
  name         = "query-connector-umls-api-key"
  key_vault_id = resource.azurerm_key_vault.kv.id
}

data "azurerm_key_vault_secret" "query_connector_ersd_api_key" {
  name         = "query-connector-ersd-api-key"
  key_vault_id = resource.azurerm_key_vault.kv.id
}

data "azurerm_key_vault_secret" "query_connector_auth_secret" {
  name         = "query-connector-auth-secret"
  key_vault_id = resource.azurerm_key_vault.kv.id
}

data "azurerm_key_vault_secret" "query_connector_tenant" {
  name         = "query-connector-${local.env}-azuread-tenant-id"
  key_vault_id = resource.azurerm_key_vault.kv.id
}

data "azurerm_key_vault_secret" "query_connector_auth_client_id" {
  name         = "query-connector-${local.env}-client-id"
  key_vault_id = resource.azurerm_key_vault.kv.id
}

data "azurerm_key_vault_secret" "query_connector_auth_client_secret" {
  name         = "query-connector-${local.env}-client-secret"
  key_vault_id = resource.azurerm_key_vault.kv.id
}