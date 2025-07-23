output "resource_group_name" {
  value = azurerm_resource_group.rg.name
}

output "resource_group_location" {
  value = azurerm_resource_group.rg.location
}

output "resource_group_id" {
  value = azurerm_resource_group.rg.id
}

output "acr_name" {
  value = azurerm_container_registry.acr.name
}

output "acr_url" {
  value = azurerm_container_registry.acr.login_server
}

output "acr_admin_username" {
  value = azurerm_container_registry.acr.admin_username
}

output "acr_admin_password" {
  value     = azurerm_container_registry.acr.admin_password
  sensitive = true
}

output "azure_storage_connection_string" {
  value = azurerm_storage_account.app.primary_connection_string
}

output "azure_container_name" {
  value = azurerm_storage_container.ecr_data.name
}