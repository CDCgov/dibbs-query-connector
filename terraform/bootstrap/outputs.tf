output "resource_group_name" {
  description = "Resource group for terraform/azure."
  value       = azurerm_resource_group.qc.name
}

output "github_identity_client_id" {
  description = "Set as the AZURE_CLIENT_ID repository variable in GitHub."
  value       = azurerm_user_assigned_identity.github.client_id
}

output "tenant_id" {
  description = "Set as the AZURE_TENANT_ID repository variable in GitHub."
  value       = data.azurerm_client_config.current.tenant_id
}

output "subscription_id" {
  description = "Set as the AZURE_SUBSCRIPTION_ID repository variable in GitHub."
  value       = var.subscription_id
}
