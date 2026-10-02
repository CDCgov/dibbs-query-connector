# One-time bootstrap for the Query Connector Azure deployment.
#
# Creates the resource group, the user-assigned managed identity that GitHub
# Actions assumes through OIDC, and the role assignments that identity needs.
# Applied locally by a subscription Owner; everything else is applied by CD
# from terraform/demo.

locals {
  state_container_scope = "${data.azurerm_storage_account.state.id}/blobServices/default/containers/ce-tfstate"

  # GitHub OIDC subjects that may exchange a token for this identity.
  federated_subjects = {
    main         = "repo:${var.github_repository}:ref:refs/heads/main"
    environment  = "repo:${var.github_repository}:environment:${var.github_environment}"
    pull_request = "repo:${var.github_repository}:pull_request"
  }

  identity_role_assignments = {
    rg_contributor    = { role = "Contributor", scope = azurerm_resource_group.qc.id }
    kv_global_secrets = { role = "Key Vault Secrets User", scope = data.azurerm_key_vault.global.id }
    kv_demo_secrets   = { role = "Key Vault Secrets User", scope = data.azurerm_key_vault.demo.id }
    state_blob        = { role = "Storage Blob Data Contributor", scope = local.state_container_scope }
    hub_vnet_network  = { role = "Network Contributor", scope = data.azurerm_virtual_network.hub.id }
    global_rg_reader  = { role = "Reader", scope = data.azurerm_resource_group.global.id }
    hub_rg_reader     = { role = "Reader", scope = data.azurerm_resource_group.hub.id }
  }
}

resource "azurerm_resource_group" "qc" {
  name     = var.resource_group_name
  location = var.location
  tags     = var.tags
}

resource "azurerm_user_assigned_identity" "github" {
  name                = "${var.resource_group_name}-github"
  location            = azurerm_resource_group.qc.location
  resource_group_name = azurerm_resource_group.qc.name
  tags                = var.tags
}

resource "azurerm_federated_identity_credential" "github" {
  for_each = local.federated_subjects

  name                = "github-${each.key}"
  resource_group_name = azurerm_resource_group.qc.name
  parent_id           = azurerm_user_assigned_identity.github.id
  audience            = ["api://AzureADTokenExchange"]
  issuer              = "https://token.actions.githubusercontent.com"
  subject             = each.value
}

resource "azurerm_role_assignment" "github" {
  for_each = local.identity_role_assignments

  scope                = each.value.scope
  role_definition_name = each.value.role
  principal_id         = azurerm_user_assigned_identity.github.principal_id
  principal_type       = "ServicePrincipal"
}

# Whoever applies this root (a subscription Owner) also needs data-plane access
# to write the Query Connector secrets into the shared vaults.
resource "azurerm_role_assignment" "operator_kv_secrets_officer" {
  for_each = {
    global = data.azurerm_key_vault.global.id
    demo   = data.azurerm_key_vault.demo.id
  }

  scope                = each.value
  role_definition_name = "Key Vault Secrets Officer"
  principal_id         = data.azurerm_client_config.current.object_id
}
