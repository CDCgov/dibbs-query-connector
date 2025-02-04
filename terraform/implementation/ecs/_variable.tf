variable "availability_zones" {
  description = "The availability zones to use"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "internal" {
  description = "Flag to determine if the several AWS resources are public (intended for external access, public internet) or private (only intended to be accessed within your AWS VPC or avaiable with other means, a transit gateway for example)."
  type        = bool
  default     = false
}

variable "owner" {
  description = "The owner of the infrastructure"
  type        = string
  default     = "skylight"
}

# Manually update to set the version you want to run
# variable "phdi_version" {
#   description = "PHDI container image version"
#   type        = string
#   default     = "v1.7.6"
# }

variable "private_subnets" {
  description = "The private subnets"
  type        = list(string)
  default     = ["176.24.1.0/24", "176.24.3.0/24"]
}

variable "project" {
  description = "The project name"
  type        = string
  default     = "qc"
}

variable "public_subnets" {
  description = "The public subnets"
  type        = list(string)
  default     = ["176.24.2.0/24", "176.24.4.0/24"]
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "The CIDR block for the VPC"
  type        = string
  default     = "176.24.0.0/16"
}

variable "qc_db_name" {
  type        = string
  description = "The name of the tefca database"
  default     = "queryconnector_db"
}
# Note: only lowercase alphanumeric characters and hyphens allowed in "identifier"
variable "db_identifier" {
  type        = string
  description = "Name of RDS Instance"
  default     = "qc-db"
}

variable "db_username" {
  type        = string
  description = "Username of RDS Instance"
  default     = "qcDbUser"
}

variable "db_engine_type" {
  type        = string
  description = "Engine of RDS Instance"
  default     = "postgres"
}

variable "db_engine_version" {
  type        = string
  description = "Engine Version of RDS Instance"
  default     = "16.3"
}

variable "db_instance_class" {
  type        = string
  description = "The instance type of the RDS instance"
  default     = "db.t3.micro"
}


variable "db_family" {
  type        = string
  description = "RDS Family"
  default     = "postgres16"
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

variable "umls_api_key" {
  type        = string
  description = "Key for the UMLS API"
  sensitive   = true
}

variable "ersd_api_key" {
  type        = string
  description = "Key for the ERSD API"
  sensitive   = true
}

variable "qc_tls_key" {
  type        = string
  description = "Key for the Cloudfare cert for domain: queryconnector.dev"
  sensitive   = true
}

variable "qc_tls_cert" {
  type        = string
  description = "Certificate importing from Cloudfare: queryconnector.dev"
  sensitive   = true
}

variable "auth_secret" {
  type        = string
  description = "Secret for the Auth server"
  sensitive   = true
}

variable "keycloak_client_id" {
  type        = string
  description = "Client ID for Keycloak"
  sensitive   = true
}

variable "keycloak_client_secret" {
  type        = string
  description = "Client Secret for Keycloak"
  sensitive   = true
}

variable "auth_keycloak_issuer" {
  type        = string
  description = "URL for Keycloak"
  sensitive   = true
}

variable "auth_redirect_proxy_url" {
  type        = string
  description = "URL for the Auth Redirect Proxy"
  sensitive   = true
}
