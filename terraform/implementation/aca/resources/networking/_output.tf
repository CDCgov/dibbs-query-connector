output "subnet_appgw_id" {
  value = azurerm_subnet.appgw.id
}

output "subnet_aca_id" {
  value = azurerm_subnet.aca.id
}

output "network" {
  value = azurerm_virtual_network.vnet
}
