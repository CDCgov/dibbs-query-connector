resource "azurerm_private_dns_zone" "aca_zone" {
  name                = azurerm_container_app_environment.ce_apps.default_domain
  resource_group_name = var.resource_group_name
}

resource "azurerm_private_dns_a_record" "aca_record" {
  name                = "*"
  zone_name           = azurerm_private_dns_zone.aca_zone.name
  resource_group_name = var.resource_group_name
  ttl                 = 300
  records             = [azurerm_container_app_environment.ce_apps.static_ip_address]
}

resource "azurerm_private_dns_zone_virtual_network_link" "aca_vnet_link" {
  name                  = "${local.name}-vnet-link"
  resource_group_name   = var.resource_group_name
  private_dns_zone_name = azurerm_private_dns_zone.aca_zone.name
  virtual_network_id    = var.vnet_id
}

resource "azurerm_public_ip" "aca_ingress" {
  name                = "${local.name}-aca-gateway-ip"
  location            = var.location
  resource_group_name = var.resource_group_name
  allocation_method   = "Static"
  sku                 = "Standard"

  domain_name_label = local.name
}

resource "azurerm_user_assigned_identity" "gateway" {
  count               = var.pre_assigned_identity_id == "" ? 1 : 0 // Only create if not provided
  name                = "dibbs-${var.env}-gateway"
  location            = var.location
  resource_group_name = var.resource_group_name

  tags = var.tags
}

resource "azurerm_application_gateway" "load_balancer" {
  name                = "${local.name}-app-gateway"
  resource_group_name = var.resource_group_name
  location            = var.location

  sku {
    name = "WAF_v2"
    tier = "WAF_v2"
  }

  autoscale_configuration {
    min_capacity = var.autoscale_min
    max_capacity = var.autoscale_max
  }

  gateway_ip_configuration {
    name      = "${local.name}-gateway-ip-config"
    subnet_id = var.appgw_subnet_id
  }

  identity {
    type         = "UserAssigned"
    identity_ids = [try(coalesce(var.pre_assigned_identity_id, azurerm_user_assigned_identity.gateway[0].id), var.pre_assigned_identity_id)]
  }

  frontend_ip_configuration {
    name                 = local.frontend_config
    public_ip_address_id = azurerm_public_ip.aca_ingress.id
  }

  # --- HTTP Listener
  frontend_port {
    name = local.http_listener
    port = 80
  }

  http_listener {
    name                           = local.http_listener
    frontend_ip_configuration_name = local.frontend_config
    frontend_port_name             = local.http_listener
    protocol                       = "Http"
  }

  # --- HTTPS Listener (only if SSL is enabled)
  dynamic "frontend_port" {
    for_each = var.use_ssl ? [1] : []
    content {
      name = local.https_listener
      port = 443
    }
  }


  dynamic "http_listener" {
    for_each = var.use_ssl ? [1] : []
    content {
      name                           = local.https_listener
      frontend_ip_configuration_name = local.frontend_config
      frontend_port_name             = local.https_listener
      protocol                       = "Https"
      ssl_certificate_name           = "dibbs-site-cert"
    }
  }


  dynamic "ssl_certificate" {
    for_each = var.use_ssl ? [1] : []

    content {
      name                = "dibbs-site-cert"
      key_vault_secret_id = data.azurerm_key_vault_certificate.dibbs_site_cert[0].secret_id
    }
  }

  # --- Container Environment Pool

  backend_address_pool {
    name         = local.aca_backend_pool
    ip_addresses = [azurerm_container_app_environment.ce_apps.static_ip_address]
  }

  backend_http_settings {
    name                  = local.aca_backend_http_setting
    cookie_based_affinity = "Disabled"
    path                  = "/"
    port                  = 80
    protocol              = "Http"
    request_timeout       = 60
    host_name             = azurerm_container_app_environment.ce_apps.default_domain
  }

 
  # --- eCR Viewer Settings

  backend_address_pool {
    name  = local.ecr_viewer_backend_pool
    fqdns = [azurerm_container_app.aca_apps["ecr-viewer"].ingress[0].fqdn]
  }

  backend_http_settings {
    name                  = local.ecr_viewer_backend_http_setting
    cookie_based_affinity = "Disabled"
    port                  = 80
    protocol              = "Http"
    request_timeout       = 60
    host_name             = azurerm_container_app.aca_apps["ecr-viewer"].ingress[0].fqdn
    probe_name            = "ecr-viewer-probe"
  }

  probe {
    host                = azurerm_container_app.aca_apps["ecr-viewer"].ingress[0].fqdn
    name                = "ecr-viewer-probe"
    protocol            = "Http"
    path                = "/ecr-viewer/api/health-check"
    interval            = 30
    timeout             = 30
    unhealthy_threshold = 3

    match {
      status_code = ["200"]
    }

  }

  # ------- Routing -------------------------

  request_routing_rule {
    name                       = "${local.name}-routing-http"
    priority                   = 200
    rule_type                  = "PathBasedRouting"
    http_listener_name         = local.http_listener
    backend_address_pool_name  = local.aca_backend_pool
    backend_http_settings_name = local.aca_backend_http_setting
    url_path_map_name          = "${local.name}-urlmap"
  }

  dynamic "request_routing_rule" {
    for_each = var.use_ssl ? [1] : []
    content {
      name                       = "${local.name}-routing-https"
      priority                   = 100
      rule_type                  = "PathBasedRouting"
      http_listener_name         = local.https_listener
      backend_address_pool_name  = local.aca_backend_pool
      backend_http_settings_name = local.aca_backend_http_setting
      url_path_map_name          = "${local.name}-urlmap"
    }
  }

  url_path_map {
    name                               = "${local.name}-urlmap"
    default_backend_address_pool_name  = local.aca_backend_pool
    default_backend_http_settings_name = local.aca_backend_http_setting



    path_rule {
      name                       = "ecr-viewer"
      paths                      = ["/ecr-viewer/*", "/ecr-viewer"]
      backend_address_pool_name  = local.ecr_viewer_backend_pool
      backend_http_settings_name = local.ecr_viewer_backend_http_setting
    }
  }

  depends_on = [
    azurerm_public_ip.aca_ingress,
    //azurerm_key_vault_access_policy.gateway
  ]

  firewall_policy_id = azurerm_web_application_firewall_policy.aca_waf_policy.id

  // Consider uncommenting this line if your tags will be managed exclusively by Terraform.
  // tags = var.tags

  // Consider removing this block if your tags will be managed exclusively by Terraform.
  lifecycle {
    ignore_changes = [
      tags
    ]
  }
}

resource "azurerm_key_vault" "kv" {
  name                        = "${var.team}${var.project}${var.env}kv"
  location                    = var.location
  resource_group_name         = var.resource_group_name
  enabled_for_disk_encryption = true
  tenant_id                   = data.azurerm_client_config.current.tenant_id
  soft_delete_retention_days  = 7
  purge_protection_enabled    = false

  sku_name = "standard"

  //It's recommended to set an access control list for the key vault. The network_acls block can be removed if your needs require it.
  network_acls {
    bypass                     = "AzureServices"
    default_action             = "Deny"
    virtual_network_subnet_ids = [var.aca_subnet_id, var.appgw_subnet_id]
  }

}

resource "azurerm_key_vault_access_policy" "gateway" {
  key_vault_id = azurerm_key_vault.kv.id
  object_id    = azurerm_user_assigned_identity.gateway[0].principal_id
  tenant_id    = data.azurerm_client_config.current.tenant_id

  secret_permissions = ["Get"]
}


// Gateway analytics
resource "azurerm_monitor_diagnostic_setting" "logs_metrics" {
  name                       = "${local.name}-gateway-logs-metrics"
  target_resource_id         = azurerm_application_gateway.load_balancer.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.aca_analytics.id

  dynamic "enabled_log" {
    for_each = [
      "ApplicationGatewayAccessLog",
      "ApplicationGatewayPerformanceLog",
      "ApplicationGatewayFirewallLog",
    ]
    content {
      category = enabled_log.value

      retention_policy {
        enabled = false
      }
    }
  }

  dynamic "metric" {
    for_each = [
      "AllMetrics",
    ]
    content {
      category = metric.value

      retention_policy {
        enabled = false
      }
    }
  }
}

