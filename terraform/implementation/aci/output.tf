output "resource_group_name" {
  value = data.azurerm_resource_group.aci.name
}

output "resource_group_location" {
  value = data.azurerm_resource_group.aci.location
}

output "resource_group_id" {
  value = data.azurerm_resource_group.aci.id
}

output "virtual_network_id" {
  value = azurerm_virtual_network.qc-vn.id
}


output "virtual_network_name" {
  value = azurerm_virtual_network.qc-vn.name
}

output "application_gateway_id" {
  value = azurerm_application_gateway.appgw.id
}

output "aci_backend_pool_names" {
  value       = local.backend_address_pool_name
}

