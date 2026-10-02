variable "subscription_id" {
  description = "Azure subscription that hosts the DIBBs demo environments (\"CDC - DIBBs\")."
  type        = string
  default     = "6848426c-8ca8-4832-b493-fed851be1f95"
}

variable "location" {
  description = "Azure region for the Query Connector resource group."
  type        = string
  default     = "eastus"
}

variable "resource_group_name" {
  description = "Resource group that holds every Query Connector resource."
  type        = string
  default     = "dibbs-qc"
}

variable "github_repository" {
  description = "GitHub repository (owner/name) allowed to deploy via OIDC."
  type        = string
  default     = "CDCgov/dibbs-query-connector"
}

variable "github_environment" {
  description = "GitHub Actions environment used by the deploy job."
  type        = string
  default     = "demo"
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
