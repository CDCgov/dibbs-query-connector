locals {
  team     = "qc-client" //Update this to match your chosen prefix
  project  = "qc"
  env      = "dev"
  location = "eastus" //Update this to match your chosen region
}

module "foundations" {
  source   = "../resources/foundations"
  team     = local.team
  project  = local.project
  env      = local.env
  location = local.location
}

module "networking" {
  source              = "../resources/networking"
  team                = local.team
  project             = local.project
  env                 = local.env
  location            = local.location
  resource_group_name = module.foundations.resource_group_name

  //These can be configured to match your network requirements.
  //We recommend /24 at minumum for the network address space,
  //and /25 for the ACA subnet. (Allows for 58 individual nodes)
  network_address_space               = ["10.30.0.0/24"]
  aca_subnet_address_prefixes         = ["10.30.0.0/25"]
  app_gateway_subnet_address_prefixes = ["10.30.0.128/26"]
}

module "container_apps" {
  source              = "../resources/aca"
  team                = local.team
  project             = local.project
  env                 = local.env
  location            = local.location
  resource_group_name = module.foundations.resource_group_name

  aca_subnet_id   = module.networking.subnet_aca_id
  appgw_subnet_id = module.networking.subnet_appgw_id
  vnet_id         = module.networking.network.id

  acr_url      = module.foundations.acr_url
  acr_username = module.foundations.acr_admin_username //TODO: Change to an ACA-specific password
  acr_password = module.foundations.acr_admin_password //TODO: Change to an ACA-specific password

  qc_version = "0.9.1"

  azure_storage_connection_string = module.foundations.azure_storage_connection_string
  azure_container_name            = module.foundations.azure_container_name


  nextauth_url = "https://${local.team}-${local.project}-${local.env}.${local.location}.cloudapp.azure.com/ecr-viewer/api/auth"

  key_vault_id = "<UPDATE_ME>" //Update this to match your target key vault. Follows the longform format: "/subscriptions/{subscription-id}/resourceGroups/{resource-group-name}/providers/Microsoft.KeyVault/vaults/{key-vault-name}"


  use_ssl = false //Set this to false if you do not want to use SSL for the ACA gateway.

  pre_assigned_identity_id = "<UPDATE_ME>" //Set to the ID of a user-assigned managed identity for your gateway if you want to use one. Follows the longform format: "/subscriptions/{subscription-id}/resourceGroups/{resource-group-name}/providers/Microsoft.ManagedIdentity/userAssignedIdentities/{identity-name}"
}