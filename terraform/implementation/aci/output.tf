output "resource_group_name" {
  value = data.azurerm_resource_group.aci.name
}

output "resource_group_location" {
  value = data.azurerm_resource_group.aci.location
}

output "resource_group_id" {
  value = data.azurerm_resource_group.aci.id
}