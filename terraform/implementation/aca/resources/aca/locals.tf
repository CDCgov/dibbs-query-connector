locals {
  env      = "dev"    // TODO: Change this to match your desired environment (e.g., dev, test, prod). Make sure to vary this between environments.
  name = "${var.team}-${var.project}-${var.env}"

  workload_profile = "qc-profile"
  
  registry = {
    server   = var.acr_url
    username = var.acr_username
    password = var.acr_password
  }

  // Configuration and environment variables for the building blocks are reflected below.
  // CPU and memory settings can be adjusted as necessary within the bounds of your workload profile.
  building_block_definitions = {

    message-parser = {
      name        = "message-parser"
      cpu         = 0.5
      memory      = "1Gi"
      

      is_public = false

      env_vars = []

      target_port = 8080
    }
    

    query-connector = {
      name        = "query-connector"
      cpu         = 0.5
      memory      = "1.5Gi"
      qc_version= var.qc_version

      is_public = true

      env_vars = [
        {
          name  = "location",
          value = var.location
        },
        {
          name  = "fhir_url",
          value = var.fhir_url
        },
        {
          name  = "cred_manager",
          value = var.cred_manager
        },
        {
          name  = "DATABASE_URL"
          value = "postgres://${data.azurerm_key_vault_secret.query_connector_db_username.value}:${data.azurerm_key_vault_secret.query_connector_db_password.value}@${var.database_endpoint}:${var.database_port}/${var.database_name}?sslmode=require"
        },
        {
          name  = "FLYWAY_URL",
          value = "jdbc:postgresql://${var.database_endpoint}:5432/${var.database_name}"
        },
        {
          name  = "FLYWAY_PASSWORD",
          value = "${data.azurerm_key_vault_secret.query_connector_db_password.value}"
        },
        {
          name  = "UMLS_API_KEY",
          value = "${data.azurerm_key_vault_secret.query_connector_umls_api_key.value}"
        },
        {
          name = "ERSD_API_KEY",
          value = "${data.azurerm_key_vault_secret.query_connector_ersd_api_key.value}"
        },
        {
          name  = "NEXT_PUBLIC_AUTH_PROVIDER",
          value = var.auth_provider
        },
        {
          name  = "AUTH_SECRET",
          value = "${data.azurerm_key_vault_secret.query_connector_auth_secret.value}"
        },
        {
          name  = "AUTH_CLIENT_ID",
          value = "${data.azurerm_key_vault_secret.query_connector_auth_client_id.value}"
        },
        {
          name  = "AUTH_CLIENT_SECRET",
          value = "${data.azurerm_key_vault_secret.query_connector_auth_client_secret.value}"
        },
        {
          name  = "AUTH_ISSUER",
          value = "https://login.microsoftonline.com/${data.azurerm_key_vault_secret.query_connector_tenant.value}/v2.0"
        },
        {
          name  = "AUTH_DISABLED",
          value = "true"
        },
        {
          name  = "ENTRA_TENANT_ID",
          value = "${data.azurerm_key_vault_secret.query_connector_tenant.value}"
        },
        {
          name  = "AUTH_URL",
          value = "https://connector.dibbs.tools"
        },
        {
          name  = "APP_HOSTNAME",
          value = "connector.dibbs.tools"
        }        
      ]

      target_port = 3000
    }
}
  http_listener   = "${local.name}-http"
  https_listener  = "${local.name}-https"
  frontend_config = "${local.name}-config"
  redirect_rule   = "${local.name}-redirect"
 
  aca_backend_pool                    = "${local.name}-be-aca"
  aca_backend_http_setting            = "${local.name}-be-aca-http"
  orchestration_backend_pool          = "${local.name}-be-orchestration"
  orchestration_backend_http_setting  = "${local.name}-be-orchestration-http"
  orchestration_backend_https_setting = "${local.name}-be-orchestration-https"
  ecr_viewer_backend_pool             = "${local.name}-be-ecr_viewer"
  ecr_viewer_backend_http_setting     = "${local.name}-be-api-ecr_viewer-http"
  ecr_viewer_backend_https_setting    = "${local.name}-be-api-ecr_viewer-https"
  }