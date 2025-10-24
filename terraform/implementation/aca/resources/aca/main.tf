resource "azurerm_log_analytics_workspace" "aca_analytics" {
  name                = "${local.name}-aca-logs"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = "PerGB2018"
  retention_in_days   = 30

  daily_quota_gb = 5
}

resource "azurerm_container_app_environment" "ce_apps" {
  name                       = "${local.name}-apps"
  location                   = var.location
  resource_group_name        = var.resource_group_name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.aca_analytics.id

  infrastructure_resource_group_name = "${local.name}-apps-rg"
  infrastructure_subnet_id           = var.aca_subnet_id

  /*
   * Can create additional profiles for FHIR converter, etc. if needed.
   * Be sure to adjust the value for workload_profile_type if your building blocks
   * hit the resource cap.
   */
  workload_profile {
    name                  = local.workload_profile
    workload_profile_type = "D4"
    maximum_count         = 10
    minimum_count         = 1
  }

  internal_load_balancer_enabled = true
}

/*
 * Due to internal timings within Azure, the container registry needs extra time to process the presence
 * of the images before they are available to be read by the Azure Container Apps environment.
 */
resource "time_sleep" "wait_for_app_images" {
  depends_on      = [dockerless_remote_image.dibbs]
  create_duration = "60s"
}

resource "azurerm_container_app" "aca_apps" {
  for_each = local.building_block_definitions

  name                         = each.value.name
  container_app_environment_id = azurerm_container_app_environment.ce_apps.id
  resource_group_name          = var.resource_group_name
  revision_mode                = "Single"

  template {
    container {
      name   = each.value.name
      image  = "${var.acr_url}/${each.value.name}:${each.value.app_version}"
      cpu    = each.value.cpu
      memory = each.value.memory

      dynamic "env" {
        for_each = each.value.env_vars

        content {
          name  = env.value.name
          value = env.value.value
        }
      }
    }
  }

  ingress {
    allow_insecure_connections = true
    external_enabled           = each.value.is_public
    target_port                = each.value.target_port
    transport                  = "auto"

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  registry {
    server               = var.acr_url
    username             = var.acr_username
    password_secret_name = "acr-password-secret"
  }

  secret {
    name  = "acr-password-secret"
    value = var.acr_password
  }

  workload_profile_name = local.workload_profile

  depends_on = [time_sleep.wait_for_app_images]
}