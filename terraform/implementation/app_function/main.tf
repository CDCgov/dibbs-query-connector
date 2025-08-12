
locals {
  qc_resource_group = "qc-aca-rg"
  location                = "East US 2"
  project                 = "qc"
  environment = "dev"
  storage_account = "qcacastorageaccount" 
}


data "azurerm_resource_group" "qc_rg" {
  name = local.qc_resource_group
}

data "azurerm_storage_account" "qc_storage_account" {
    name = local.storage_account
    resource_group_name = local.qc_resource_group
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

resource "azurerm_linux_function_app" "qc_linux_function_app" {
  name                = "qc-linux-function-app"
  location            = local.location
  resource_group_name = data.azurerm_resource_group.qc_rg.name
  service_plan_id     = azurerm_service_plan.qc_plan.id

  storage_account_name       = data.azurerm_storage_account.qc_storage_account.name
  storage_account_access_key = data.azurerm_storage_account.qc_storage_account.primary_access_key
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
    FUNCTIONS_EXTENSION_VERSION = "~4"
    FUNCTIONS_WORKER_RUNTIME    = "node"
    AzureWebJobsStorage         = data.azurerm_storage_account.qc_storage_account.primary_connection_string
  }

  # If you want Terraform to push your ZIP directly:
  # zip_deploy_file = "${path.module}/dist/app.zip"
}




resource "azurerm_function_app_function" "qc_app_function" {
  name            = "${local.project}-${local.environment}-function-app"
  function_app_id = azurerm_linux_function_app.qc_linux_function_app.id
  language = "TypeScript"

  config_json = jsonencode({
    bindings = [
      { type = "httpTrigger", authLevel = "function", direction = "in",  name = "req" },
      { type = "http",        direction = "out",       name = "res" }
    ]
  })
}
