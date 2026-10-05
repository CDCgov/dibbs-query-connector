locals {
  public_url = "https://${var.hostname}"

  db_host = data.azurerm_postgresql_flexible_server.global.fqdn
  db_user = data.azurerm_key_vault_secret.global["db_user"].value
  db_pass = data.azurerm_key_vault_secret.global["db_password"].value

  database_url = "postgres://${urlencode(local.db_user)}:${urlencode(local.db_pass)}@${local.db_host}:5432/${var.database_name}?sslmode=require"
  flyway_url   = "jdbc:postgresql://${local.db_host}:5432/${var.database_name}"

  entra_tenant_id = data.azurerm_key_vault_secret.global["entra_tenant_id"].value

  # Internal FQDN of the Aidbox app inside the environment (internal ingress).
  aidbox_internal_url = "http://aidbox.internal.${azurerm_container_app_environment.qc.default_domain}"

  # Values injected through Container Apps secrets rather than plain env vars.
  query_connector_secrets = {
    database-url       = local.database_url
    flyway-password    = local.db_pass
    auth-secret        = data.azurerm_key_vault_secret.demo["auth_secret"].value
    auth-client-secret = data.azurerm_key_vault_secret.global["auth_client_secret"].value
    umls-api-key       = data.azurerm_key_vault_secret.demo["umls_api_key"].value
    ersd-api-key       = data.azurerm_key_vault_secret.demo["ersd_api_key"].value
    aidbox-license     = data.azurerm_key_vault_secret.demo["aidbox_license"].value
  }

  query_connector_env = merge(
    {
      APP_HOSTNAME              = local.public_url
      AUTH_URL                  = local.public_url
      AUTH_DISABLED             = "false"
      NEXT_PUBLIC_AUTH_PROVIDER = "microsoft-entra-id"
      AUTH_CLIENT_ID            = data.azurerm_key_vault_secret.global["auth_client_id"].value
      AUTH_ISSUER               = "https://login.microsoftonline.com/${local.entra_tenant_id}/v2.0"
      ENTRA_TENANT_ID           = local.entra_tenant_id
      FLYWAY_URL                = local.flyway_url
      FLYWAY_USER               = local.db_user
      AIDBOX_BASE_URL           = local.aidbox_internal_url
      DEMO_MODE                 = var.demo_mode ? "true" : "false"
    },
    var.db_ssl_ca_path == "" ? {} : { DB_SSL_CA_PATH = var.db_ssl_ca_path },
  )

  # env var name => container app secret name
  query_connector_secret_env = {
    DATABASE_URL       = "database-url"
    FLYWAY_PASSWORD    = "flyway-password"
    AUTH_SECRET        = "auth-secret"
    AUTH_CLIENT_SECRET = "auth-client-secret"
    UMLS_API_KEY       = "umls-api-key"
    ERSD_API_KEY       = "ersd-api-key"
    AIDBOX_LICENSE     = "aidbox-license"
  }
}

resource "azurerm_log_analytics_workspace" "qc" {
  name                = "${var.resource_group_name}-logs"
  location            = var.location
  resource_group_name = data.azurerm_resource_group.qc.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  daily_quota_gb      = 5
  tags                = var.tags
}

resource "azurerm_container_app_environment" "qc" {
  name                               = "${var.resource_group_name}-env"
  location                           = var.location
  resource_group_name                = data.azurerm_resource_group.qc.name
  log_analytics_workspace_id         = azurerm_log_analytics_workspace.qc.id
  infrastructure_subnet_id           = azurerm_subnet.aca.id
  infrastructure_resource_group_name = "${var.resource_group_name}-env-infra"
  internal_load_balancer_enabled     = true
  tags                               = var.tags

  workload_profile {
    name                  = "Consumption"
    workload_profile_type = "Consumption"
  }
}

resource "azurerm_container_app" "query_connector" {
  name                         = "query-connector"
  container_app_environment_id = azurerm_container_app_environment.qc.id
  resource_group_name          = data.azurerm_resource_group.qc.name
  revision_mode                = "Single"
  workload_profile_name        = "Consumption"
  tags                         = var.tags

  template {
    min_replicas = 1
    max_replicas = var.query_connector_max_replicas

    container {
      name   = "query-connector"
      image  = var.image
      cpu    = var.query_connector_cpu
      memory = var.query_connector_memory

      dynamic "env" {
        for_each = local.query_connector_env
        content {
          name  = env.key
          value = env.value
        }
      }

      dynamic "env" {
        for_each = local.query_connector_secret_env
        content {
          name        = env.key
          secret_name = env.value
        }
      }

      # Flyway runs before the server starts, so give startup generous room.
      startup_probe {
        transport               = "HTTP"
        port                    = 3000
        path                    = "/api"
        interval_seconds        = 10
        timeout                 = 5
        failure_count_threshold = 30
      }

      readiness_probe {
        transport               = "HTTP"
        port                    = 3000
        path                    = "/api"
        interval_seconds        = 10
        timeout                 = 5
        failure_count_threshold = 3
        success_count_threshold = 1
      }

      liveness_probe {
        transport               = "HTTP"
        port                    = 3000
        path                    = "/api"
        initial_delay           = 30
        interval_seconds        = 30
        timeout                 = 5
        failure_count_threshold = 3
      }
    }
  }

  # "external" here means reachable from outside the environment, i.e. from
  # the peered hub VNet. The environment itself has an internal load balancer,
  # so nothing is exposed to the internet except through the hub App Gateway.
  ingress {
    external_enabled           = true
    target_port                = 3000
    transport                  = "auto"
    allow_insecure_connections = true

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  dynamic "secret" {
    for_each = local.query_connector_secrets
    content {
      name  = secret.key
      value = secret.value
    }
  }
}
