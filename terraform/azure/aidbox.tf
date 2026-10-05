# Aidbox: a sample FHIR server inside the environment, seeded with test
# patients so the demo can run queries without external sandboxes.

locals {
  aidbox_db_user = data.azurerm_key_vault_secret.demo["aidbox_db_user"].value
  aidbox_db_pass = data.azurerm_key_vault_secret.demo["aidbox_db_password"].value

  aidbox_secrets = {
    aidbox-license        = data.azurerm_key_vault_secret.demo["aidbox_license"].value
    aidbox-client-secret  = data.azurerm_key_vault_secret.demo["aidbox_client_secret"].value
    aidbox-admin-password = data.azurerm_key_vault_secret.demo["aidbox_admin_password"].value
    pg-password           = local.aidbox_db_pass
  }

  # Mirrors the aidbox service in docker-compose-dev.yaml.
  aidbox_env = {
    AIDBOX_BASE_URL                                 = local.aidbox_internal_url
    AIDBOX_PORT                                     = "8080"
    AIDBOX_TERMINOLOGY_SERVICE_BASE_URL             = "https://tx.fhir.org/r4"
    AIDBOX_FHIR_PACKAGES                            = "hl7.fhir.r4.core#4.0.1"
    AIDBOX_FHIR_SCHEMA_VALIDATION                   = "true"
    AIDBOX_CREATED_AT_URL                           = "https://aidbox.app/ex/createdAt"
    AIDBOX_CORRECT_AIDBOX_FORMAT                    = "true"
    AIDBOX_COMPLIANCE                               = "enabled"
    AIDBOX_SECURITY_AUDIT__LOG_ENABLED              = "true"
    BOX_SEARCH_FHIR__COMPARISONS                    = "true"
    BOX_COMPATIBILITY_VALIDATION_JSON__SCHEMA_REGEX = "#{:fhir-datetime}"
    BOX_SEARCH_AUTHORIZE_INLINE_REQUESTS            = "true"
    BOX_SEARCH_INCLUDE_CONFORMANT                   = "true"
    PGHOST                                          = local.db_host
    PGPORT                                          = "5432"
    PGDATABASE                                      = var.aidbox_database_name
    PGUSER                                          = local.aidbox_db_user
  }

  aidbox_secret_env = {
    AIDBOX_LICENSE        = "aidbox-license"
    AIDBOX_CLIENT_SECRET  = "aidbox-client-secret"
    AIDBOX_ADMIN_PASSWORD = "aidbox-admin-password"
    PGPASSWORD            = "pg-password"
  }
}

resource "azurerm_container_app" "aidbox" {
  name                         = "aidbox"
  container_app_environment_id = azurerm_container_app_environment.qc.id
  resource_group_name          = data.azurerm_resource_group.qc.name
  revision_mode                = "Single"
  workload_profile_name        = "Consumption"
  tags                         = var.tags

  template {
    min_replicas = 1
    max_replicas = 1

    container {
      name   = "aidbox"
      image  = var.aidbox_image
      cpu    = 1
      memory = "2Gi"

      dynamic "env" {
        for_each = local.aidbox_env
        content {
          name  = env.key
          value = env.value
        }
      }

      dynamic "env" {
        for_each = local.aidbox_secret_env
        content {
          name        = env.key
          secret_name = env.value
        }
      }

      startup_probe {
        transport               = "HTTP"
        port                    = 8080
        path                    = "/health"
        interval_seconds        = 10
        timeout                 = 5
        failure_count_threshold = 30
      }

      liveness_probe {
        transport               = "HTTP"
        port                    = 8080
        path                    = "/health"
        initial_delay           = 30
        interval_seconds        = 30
        timeout                 = 5
        failure_count_threshold = 3
      }
    }
  }

  # Internal only: reachable from apps in this environment (the seeder job and
  # Query Connector) at http://aidbox.internal.<default_domain>.
  ingress {
    external_enabled           = false
    target_port                = 8080
    transport                  = "http"
    allow_insecure_connections = true

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  dynamic "secret" {
    for_each = local.aidbox_secrets
    content {
      name  = secret.key
      value = secret.value
    }
  }
}

# Loads GoldenSickPatient, registers the Query Connector SMART client in Aidbox
# and inserts the Aidbox row into the app's fhir_servers table. Run manually
# after the first deploy (or whenever Aidbox data needs a reset):
#   az containerapp job start -g dibbs-qc -n aidbox-seeder
resource "azurerm_container_app_job" "aidbox_seeder" {
  name                         = "aidbox-seeder"
  location                     = var.location
  container_app_environment_id = azurerm_container_app_environment.qc.id
  resource_group_name          = data.azurerm_resource_group.qc.name
  workload_profile_name        = "Consumption"
  replica_timeout_in_seconds   = 1800
  replica_retry_limit          = 0
  tags                         = var.tags

  manual_trigger_config {
    parallelism              = 1
    replica_completion_count = 1
  }

  template {
    container {
      name   = "aidbox-seeder"
      image  = var.seeder_image
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "AIDBOX_BASE_URL"
        value = local.aidbox_internal_url
      }
      env {
        name  = "AIDBOX_NETWORK_URL"
        value = local.aidbox_internal_url
      }
      env {
        name  = "APP_HOSTNAME"
        value = local.public_url
      }
      env {
        name        = "AIDBOX_CLIENT_SECRET"
        secret_name = "aidbox-client-secret"
      }
      env {
        name  = "DB_ADDRESS"
        value = local.db_host
      }
      env {
        name  = "DB_PORT"
        value = "5432"
      }
      env {
        name  = "DB_NAME"
        value = var.database_name
      }
      env {
        name  = "DB_USERNAME"
        value = local.db_user
      }
      env {
        name        = "DB_PASSWORD"
        secret_name = "db-password"
      }
    }
  }

  secret {
    name  = "aidbox-client-secret"
    value = data.azurerm_key_vault_secret.demo["aidbox_client_secret"].value
  }

  secret {
    name  = "db-password"
    value = local.db_pass
  }
}
