variable "subscription_id" {
  description = "Azure subscription that hosts the DIBBs demo environments (\"CDC - DIBBs\")."
  type        = string
  default     = "6848426c-8ca8-4832-b493-fed851be1f95"
}

variable "location" {
  description = "Azure region. Must match the resource group created by terraform/bootstrap."
  type        = string
  default     = "eastus"
}

variable "resource_group_name" {
  description = "Resource group created by terraform/bootstrap."
  type        = string
  default     = "dibbs-qc"
}

variable "hostname" {
  description = "Public hostname served by the shared dibbs.tools App Gateway."
  type        = string
  default     = "connector.dibbs.tools"
}

variable "image" {
  description = "Query Connector image, pinned by digest, e.g. ghcr.io/cdcgov/dibbs-query-connector/query-connector@sha256:..."
  type        = string
}

variable "seeder_image" {
  description = "Aidbox seeder image (built from Dockerfile.aidbox-seeder), pinned by digest."
  type        = string
}

variable "aidbox_image" {
  description = "Aidbox image used as the demo FHIR server."
  type        = string
  default     = "healthsamurai/aidboxone:stable"
}

variable "address_space" {
  description = "Address space of the Query Connector VNet. Must not overlap other spokes peered to the hub (10.30.0.0/24 hub, 10.30.1.0/24 ecr-viewer, 10.30.2.0/24 ecr-refiner, 10.30.4.0/24 record-linker)."
  type        = list(string)
  default     = ["10.30.3.0/24"]
}

variable "aca_subnet_prefix" {
  description = "Subnet delegated to the Container Apps environment. Azure requires at least a /27 for workload-profile environments."
  type        = string
  default     = "10.30.3.0/25"
}

variable "database_name" {
  description = "Query Connector database on the shared dibbs-global-postgres server (managed in dibbs-tf-envs global/postgres.tf)."
  type        = string
  default     = "query_connector_demo"
}

variable "aidbox_database_name" {
  description = "Aidbox database on the shared dibbs-global-postgres server (managed in dibbs-tf-envs global/postgres.tf)."
  type        = string
  default     = "qc_aidbox"
}

variable "db_ssl_ca_path" {
  description = "CA bundle inside the app image used to verify the Postgres server certificate. Set to an empty string to disable certificate verification for Flyway and the app pool."
  type        = string
  default     = "/app/certs/azure-postgres-bundle.pem"
}

variable "demo_mode" {
  description = "Enable the app's DEMO_MODE behaviour."
  type        = bool
  default     = true
}

variable "query_connector_cpu" {
  description = "vCPU for the Query Connector container."
  type        = number
  default     = 1
}

variable "query_connector_memory" {
  description = "Memory for the Query Connector container."
  type        = string
  default     = "2Gi"
}

variable "query_connector_max_replicas" {
  description = "Maximum replicas for the Query Connector container app."
  type        = number
  default     = 2
}

variable "tags" {
  description = "Tags applied to every resource."
  type        = map(string)
  default = {
    project    = "query-connector"
    owner      = "skylight"
    managed_by = "terraform"
    source     = "CDCgov/dibbs-query-connector"
  }
}
