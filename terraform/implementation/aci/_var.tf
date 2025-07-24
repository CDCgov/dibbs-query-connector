# variable "ghcr_string" {
#   description = "The string to use for the source GitHub Container Registry"
#   type        = string
#   default     = "ghcr.io/cdcgov/dibbs-query-connector//query-connector"
# }

variable "resource_group" {
  description = "The name of the resource group to deploy to"
  type        = string
  default     = "qc-aca-rg"
}

variable "location" {
  description = "The Azure region in which the associated resources will be created."
  type        = string
  default     = "eastus"
}


variable "app_version" {
  type    = string
  default = "0.9.1"
}


variable "fhir_url" {
  type        = string
  description = "URL for FHIR server"
  default     = "undefined"
}

variable "cred_manager" {
  type        = string
  description = "URL for Credentials Manager"
  default     = "undefined"
}


variable "auth_provider" {
  type        = string
  description = "Which auth provider to use (microsoft-entra-id or keycloak)"
  default     = "microsoft-entra-id"
}

variable "auth_client_id" {
  type        = string
  description = "Client ID"
  default     = "query-connector"
}

variable "auth_issuer" {
  type        = string
  description = "URL for the Auth issuer for Entra (https://login.microsoftonline.com/your-tenant-id/v2.0 or keycloak)"
  default     = "https://login.microsoftonline.com/your-tenant-id/v2.0"
}


# variable "database_endpoint" {
#   description = "Provides the database URI for the database connection string"
#   type        = string
#   default     = "dibbs-global-postgres.postgres.database.azure.com"
# }

# variable "database_name" {
#   description = "Database name"
#   type        = string
#   default     = "query_connector_demo"
# }

variable "database_port" {
  description = "Database Port"
  type        = string
  default     = "5432"
}

# variable "server_name" {
#   description = "Server name"
#   type        = string
#   default     = "dibbs-global-postgres"
# }


variable "umls_api_key" {
  type        = string
  description = "Key for the UMLS API"
  default     = "value"
}

variable "ersd_api_key" {
  type        = string
  description = "Key for the ERSD API"
  default     = "value"
}


# variable "auth_client_secret" {
#   type        = string
#   description = "Client Secret for Keycloak"
#   sensitive   = true
# }


variable "auth_url" {
  type        = string
  description = "URL for the Auth server"
  sensitive   = true
  default = "value"
}

variable "entra_tenant_id" {
  type        = string
  description = "Entra tenant ID"
  default     = "value"

}