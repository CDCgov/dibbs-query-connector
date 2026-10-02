output "resource_group_name" {
  value = data.azurerm_resource_group.qc.name
}

output "query_connector_fqdn" {
  description = "Private FQDN the hub App Gateway uses as the backend for connector.dibbs.tools."
  value       = azurerm_container_app.query_connector.ingress[0].fqdn
}

output "query_connector_latest_revision" {
  value = azurerm_container_app.query_connector.latest_revision_name
}

output "aidbox_internal_url" {
  value = local.aidbox_internal_url
}

output "aca_environment_static_ip" {
  value = azurerm_container_app_environment.qc.static_ip_address
}

output "aca_default_domain" {
  value = azurerm_container_app_environment.qc.default_domain
}

output "private_dns_zone_id" {
  value = azurerm_private_dns_zone.aca.id
}

output "image" {
  description = "Currently deployed Query Connector image (used by the PR plan workflow)."
  value       = var.image
}

output "seeder_image" {
  description = "Currently deployed Aidbox seeder image (used by the PR plan workflow)."
  value       = var.seeder_image
}
