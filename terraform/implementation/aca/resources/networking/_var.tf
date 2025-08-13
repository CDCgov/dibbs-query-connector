variable "team" {
  description = "One-word identifier for this project's custodial team."
  type        = string
}

variable "project" {
  description = "One-word identifier or code name for this project."
  type        = string
}

variable "env" {
  description = "One-word identifier for the target environment (e.g. dev, test, prod)."
  type        = string
}

variable "location" {
  description = "The Azure region in which the associated resources will be created."
  type        = string
}

variable "resource_group_name" {
  description = "The name of the resource group to deploy to"
  type        = string
}

variable "network_address_space" {
  description = "The desired address space for the full virtual network"
  type        = list(string)
  default     = ["10.30.0.0/24"]
}

variable "aca_subnet_address_prefixes" {
  type        = list(string)
  description = "Load balancer subnet IP address space."
  default     = ["10.30.0.0/25"]
}

variable "app_gateway_subnet_address_prefixes" {
  type        = list(string)
  description = "App gateway subnet server IP address space."
  default     = ["10.30.0.128/25"]
}