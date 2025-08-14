
locals {
  qc_resource_group = "qc-aca-rg"
  location          = "East US 2"
  project           = "qc"
  environment       = "dev"
  storage_account   = "qcacastorageaccount"
  auth_provider           = "microsoft-entra-id"                                    # TODO
  auth_client_id          = "query-connector"                                       # TODO: "Client ID"
  auth_issuer             = "https://login.microsoftonline.com/your-tenant-id/v2.0" # TODO: URL for the Auth issuer for Entra (https://login.microsoftonline.com/<your-tenant-id>/v2.0 or keycloak)
  auth_url                = "http://localhost:3000"                                 # TODO: Change to URL for the Auth server
  entra_tenant_id         = "value"   
}


data "azurerm_resource_group" "qc_rg" {
  name = local.qc_resource_group
}

data "azurerm_storage_account" "qc_storage_account" {
  name                = local.storage_account
  resource_group_name = local.qc_resource_group
}

data "azurerm_application_insights" "qc-function-insight" {
  name                = "qc-linux-function-app-insights"
  resource_group_name = data.azurerm_resource_group.qc_rg.name
}

locals {
  app_files = fileset("${path.module}/function", "**")
  app_hash  = md5(join("", [for f in local.app_files : filemd5("${path.module}/function/${f}")]))
}

resource "null_resource" "build" {
  triggers = { app = local.app_hash }
  provisioner "local-exec" {
    working_dir = "${path.module}/function"
    command     = "npm ci && npm run build && npm prune --omit=dev"
  }
}

data "archive_file" "zip" {
  type        = "zip"
  source_dir  = "${path.module}/function"
  output_path = "${path.module}/dist/functionapp.zip"
  depends_on  = [null_resource.build]
}



# App Service Plan & Function App
resource "azurerm_service_plan" "qc_plan" {
  name                = "appservice-plan-qc"
  location            = local.location
  resource_group_name = data.azurerm_resource_group.qc_rg.name
  os_type             = "Linux"
  sku_name            = "P1v2"

  depends_on = [data.azurerm_resource_group.qc_rg]
}

#Manages container within an Azure Storage Account
resource "azurerm_storage_container" "pkg" {
  name                  = "function-releases"
  storage_account_name  = data.azurerm_storage_account.qc_storage_account.name
  container_access_type = "private"
}

#Manages a Blob within the Storage container
resource "azurerm_storage_blob" "pkgzip" {
  name                   = "functionapp-${formatdate("YYYYMMDDHHmmss", timestamp())}.zip"
  storage_account_name   = data.azurerm_storage_account.qc_storage_account.name
  storage_container_name = azurerm_storage_container.pkg.name
  type                   = "Block"
  source                 = data.archive_file.zip.output_path #TO DO BY ME
  content_type           = "application/zip"
}



# Shared Access Token (SAS) URL for the package
data "azurerm_storage_account_sas" "pkg" {
  connection_string = data.azurerm_storage_account.qc_storage_account.primary_connection_string
  https_only        = true
  start             = timeadd(timestamp(), "-5m")
  expiry            = timeadd(timestamp(), "168h") # 7 days; extend if needed

  resource_types {
    service   = false
    container = true
    object    = true
  }
  services {
    blob  = true
    queue = false
    table = false
    file  = false
  }
  permissions {
    read    = true
    write   = false
    delete  = false
    list    = true
    add     = false
    create  = false
    update  = true
    process = true
    tag     = false
    filter  = false
  }
}

resource "azurerm_storage_container" "message" {
  name                  = "hl7-message"
  storage_account_name  = data.azurerm_storage_account.qc_storage_account.name
  container_access_type = "private"
}

resource "azurerm_linux_function_app" "qc_linux_function_app" {
  name                = "qc-linux-function-app"
  location            = local.location
  resource_group_name = data.azurerm_resource_group.qc_rg.name
  service_plan_id     = azurerm_service_plan.qc_plan.id

  storage_account_name        = data.azurerm_storage_account.qc_storage_account.name
  storage_account_access_key  = data.azurerm_storage_account.qc_storage_account.primary_access_key
  functions_extension_version = "~4"
  
  https_only                  = true
  identity {
    type = "SystemAssigned"
  }
  site_config {
    application_stack {
      node_version = 20
    }
  }

  app_settings = {
    FUNCTIONS_EXTENSION_VERSION = ""
    FUNCTIONS_WORKER_RUNTIME    = "node"
    AzureWebJobsStorage         = data.azurerm_storage_account.qc_storage_account.primary_connection_string
    APPLICATIONINSIGHTS_CONNECTION_STRING = data.azurerm_application_insights.qc-function-insight.connection_string

    QUERY_CONNECTOR_ENDPOINT = "https://queryconnector.dev/api/query"   # <- set target endpoint
    
    AUTH_CLIENT_ID            = local.auth_client_id
    AUTH_ISSUER               = local.auth_issuer
    ENTRA_TENANT_ID           = local.entra_tenant_id
    AUTH_DISABLED             = "true"
    AUTH_URL                  = local.auth_url
    NEXT_PUBLIC_AUTH_PROVIDER = local.auth_provider
    # Zip Deploy (Run From Package)
    # WEBSITE_RUN_FROM_PACKAGE = "https://${data.azurerm_storage_account.qc_storage_account.name}.blob.core.windows.net/${azurerm_storage_container.pkg.name}/${azurerm_storage_blob.pkgzip.name}${data.azurerm_storage_account_sas.pkg.sas}"
  }

  # Deploy code in a writable way so Terraform can add function.json
  zip_deploy_file = data.archive_file.zip.output_path

  depends_on = [azurerm_storage_blob.pkgzip]
}





resource "azurerm_function_app_function" "qc_app_function" {
  name            = "${local.project}-${local.environment}-function-app"
  function_app_id = azurerm_linux_function_app.qc_linux_function_app.id
  language        = "TypeScript"

  config_json = jsonencode({
    bindings = [
      { type = "blobTrigger", direction = "in", name = "blobTrigger", connection = "AzureWebJobsStorage", path = "hl7-message/{name}" }, #The name should be the param the typescript code receives

    ]
  })
}
