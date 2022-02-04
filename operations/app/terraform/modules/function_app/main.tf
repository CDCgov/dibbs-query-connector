resource "azurerm_function_app" "pdi" {
  name                       = "${var.resource_prefix}-functionapp"
  location                   = var.location
  resource_group_name        = var.resource_group_name
  app_service_plan_id        = var.app_service_plan
  storage_account_name       = var.sa_data_name
  storage_account_access_key = var.sa_data_access_key
  https_only                 = true
  os_type                    = "linux"
  version                    = "~3"
  enable_builtin_logging     = false

  app_settings = {
    # Use the CDC DNS for everything; they have mappings for all our internal
    # resources, so if we add a new resource we'll have to contact them (see
    # prime-router/docs/dns.md)
    "WEBSITE_DNS_SERVER" = "168.63.129.16"

    # "DOCKER_REGISTRY_SERVER_URL"      = var.container_registry_login_server
    # "DOCKER_REGISTRY_SERVER_USERNAME" = var.container_registry_admin_username
    # "DOCKER_REGISTRY_SERVER_PASSWORD" = var.container_registry_admin_password

    # With this variable set, clients can only see (and pull) signed images from the registry
    # First make signing work, then enable this
    # "DOCKER_CONTENT_TRUST" = 1

    # App Insights
    "PrivateKey"                            = "@Microsoft.KeyVault(SecretUri=https://pitest-app-kv.vault.azure.net/secrets/PrivateKey/b6a52c1a0c5e4bd183b6c22fccf75306)"
    "PrivateKeyPassword"                    = "@Microsoft.KeyVault(SecretUri=https://pitest-app-kv.vault.azure.net/secrets/PrivateKeyPassword/c7f2b255b4b84cbdb244dc11ee013622)"
    "pitestdatastorage_STORAGE"             = "@Microsoft.KeyVault(SecretUri=https://pitest-app-kv.vault.azure.net/secrets/pitestdatastorageaccess/98983dbb27ec4b048311e7e4c5267c61)"
    "AZURE_STORAGE_CONNECTION_STRING"       = var.sa_data_connection_string
    "APPINSIGHTS_INSTRUMENTATIONKEY"        = var.ai_instrumentation_key
    "APPLICATIONINSIGHTS_CONNECTION_STRING" = var.ai_connection_string
    "BUILD_FLAGS"                           = "UseExpressBuild"
    "ENABLE_ORYX_BUILD"                     = "true"
    "FUNCTIONS_WORKER_RUNTIME"              = "python"
    "SCM_DO_BUILD_DURING_DEPLOYMENT"        = 1
    "VDHSFTPHostname"                       = "vdhsftp.vdh.virginia.gov"
    "VDHSFTPPassword"                       = "@Microsoft.KeyVault(SecretUri=https://pitest-app-kv.vault.azure.net/secrets/VDHSFTPPassword/f05c2e51f2b147699b7979d3eb79fe7e)"
    "VDHSFTPUsername"                       = "USDS_CDC"
    "XDG_CACHE_HOME"                        = "/tmp/.cache"
  }

  # TODO: if we have to allow inbound HTTP we'll need to revisit these

  # site_config {
  #   ip_restriction {
  #     action                    = "Allow"
  #     name                      = "AllowVNetTraffic"
  #     priority                  = 100
  #     virtual_network_subnet_id = var.public_subnet[0]
  #   }

  #   ip_restriction {
  #     action                    = "Allow"
  #     name                      = "AllowVNetEastTraffic"
  #     priority                  = 100
  #     virtual_network_subnet_id = var.public_subnet[0]
  #   }

  #   scm_use_main_ip_restriction = true

  #   http2_enabled             = true
  #   always_on                 = false
  #   use_32_bit_worker_process = false
  #   # linux_fx_version          = "DOCKER|${var.container_registry_login_server}/${var.resource_prefix}:latest"
  # }

  identity {
    type = "SystemAssigned"
  }

  tags = {
    environment = var.environment
  }

  lifecycle {
    ignore_changes = [
      # Allows Docker versioning via GitHub Actions
      site_config[0].linux_fx_version,
    ]
  }
}

resource "azurerm_function_app" "pdi_infrastructure" {
  name                       = "${var.resource_prefix}-infra-functionapp"
  location                   = var.location
  resource_group_name        = var.resource_group_name
  app_service_plan_id        = var.app_service_plan
  storage_account_name       = var.sa_data_name
  storage_account_access_key = var.sa_data_access_key
  https_only                 = true
  os_type                    = "linux"
  version                    = "~3"
  enable_builtin_logging     = false

  app_settings = {
    "APPINSIGHTS_INSTRUMENTATIONKEY"        = var.ai_instrumentation_key
    "APPLICATIONINSIGHTS_CONNECTION_STRING" = var.ai_connection_string
    "BUILD_FLAGS"                           = "UseExpressBuild"
    "ENABLE_ORYX_BUILD"                     = "true"
    "FUNCTIONS_WORKER_RUNTIME"              = "python"
    "SCM_DO_BUILD_DURING_DEPLOYMENT"        = 1
    "WEBSITE_DNS_SERVER"                    = "168.63.129.16"
    "WEBSITES_ENABLE_APP_SERVICE_STORAGE"   = false
    "XDG_CACHE_HOME"                        = "/tmp/.cache"
  }

  identity {
    type = "SystemAssigned"
  }

  site_config {
    use_32_bit_worker_process = false
    vnet_route_all_enabled    = true
  }

  tags = {
    environment = var.environment
  }
}

resource "azurerm_key_vault_access_policy" "pdi_function_app" {
  key_vault_id = var.application_key_vault_id
  tenant_id    = azurerm_function_app.pdi.identity.0.tenant_id
  object_id    = azurerm_function_app.pdi.identity.0.principal_id

  secret_permissions = [
    "Get",
  ]
}

resource "azurerm_key_vault_access_policy" "pdi_infrastructure_app" {
  key_vault_id = var.application_key_vault_id
  tenant_id    = azurerm_function_app.pdi_infrastructure.identity.0.tenant_id
  object_id    = azurerm_function_app.pdi_infrastructure.identity.0.principal_id

  secret_permissions = [
    "Get",
  ]
}

resource "azurerm_app_service_virtual_network_swift_connection" "pdi_function_app" {
  app_service_id = azurerm_function_app.pdi.id
  subnet_id      = var.cdc_app_subnet_id
}

resource "azurerm_app_service_virtual_network_swift_connection" "pdi_infrastructure_app" {
  app_service_id = azurerm_function_app.pdi_infrastructure.id
  subnet_id      = var.cdc_app_subnet_id
}
