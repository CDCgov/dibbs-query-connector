# Spoke network for the Container Apps environment, peered to the shared
# dibbs.tools hub so the hub App Gateway can reach the apps by private FQDN.

resource "azurerm_virtual_network" "qc" {
  name                = "${var.resource_group_name}-network"
  location            = var.location
  resource_group_name = data.azurerm_resource_group.qc.name
  address_space       = var.address_space
  tags                = var.tags
}

resource "azurerm_subnet" "aca" {
  name                 = "${var.resource_group_name}-aca"
  resource_group_name  = data.azurerm_resource_group.qc.name
  virtual_network_name = azurerm_virtual_network.qc.name
  address_prefixes     = [var.aca_subnet_prefix]

  delegation {
    name = "aca"

    service_delegation {
      name    = "Microsoft.App/environments"
      actions = ["Microsoft.Network/virtualNetworks/subnets/join/action"]
    }
  }
}

# Both directions of the peering are owned here so the hub configuration in
# dibbs-tf-envs does not need to know about this spoke.
resource "azurerm_virtual_network_peering" "qc_to_hub" {
  name                      = "${var.resource_group_name}-to-hub"
  resource_group_name       = data.azurerm_resource_group.qc.name
  virtual_network_name      = azurerm_virtual_network.qc.name
  remote_virtual_network_id = data.azurerm_virtual_network.hub.id
  allow_forwarded_traffic   = true
}

resource "azurerm_virtual_network_peering" "hub_to_qc" {
  name                      = "hub-to-${var.resource_group_name}"
  resource_group_name       = data.azurerm_virtual_network.hub.resource_group_name
  virtual_network_name      = data.azurerm_virtual_network.hub.name
  remote_virtual_network_id = azurerm_virtual_network.qc.id
  allow_forwarded_traffic   = true
}

# The environment uses an internal load balancer, so its default domain only
# resolves through this private zone. Linking the zone to the hub VNet is what
# lets the hub App Gateway use the container app FQDN as a backend.
resource "azurerm_private_dns_zone" "aca" {
  name                = azurerm_container_app_environment.qc.default_domain
  resource_group_name = data.azurerm_resource_group.qc.name
  tags                = var.tags
}

resource "azurerm_private_dns_a_record" "aca_wildcard" {
  name                = "*"
  zone_name           = azurerm_private_dns_zone.aca.name
  resource_group_name = data.azurerm_resource_group.qc.name
  ttl                 = 300
  records             = [azurerm_container_app_environment.qc.static_ip_address]
}

resource "azurerm_private_dns_a_record" "aca_apex" {
  name                = "@"
  zone_name           = azurerm_private_dns_zone.aca.name
  resource_group_name = data.azurerm_resource_group.qc.name
  ttl                 = 300
  records             = [azurerm_container_app_environment.qc.static_ip_address]
}

resource "azurerm_private_dns_zone_virtual_network_link" "qc" {
  name                  = "${var.resource_group_name}-link"
  resource_group_name   = data.azurerm_resource_group.qc.name
  private_dns_zone_name = azurerm_private_dns_zone.aca.name
  virtual_network_id    = azurerm_virtual_network.qc.id
  tags                  = var.tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "hub" {
  name                  = "hub-link"
  resource_group_name   = data.azurerm_resource_group.qc.name
  private_dns_zone_name = azurerm_private_dns_zone.aca.name
  virtual_network_id    = data.azurerm_virtual_network.hub.id
  tags                  = var.tags
}
