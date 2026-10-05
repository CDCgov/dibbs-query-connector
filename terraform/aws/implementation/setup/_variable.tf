variable "oidc_github_repo" {
  description = "The GitHub repository for OIDC"
  type        = string
  default     = ""
}

variable "owner" {
  description = "The owner of the project"
  type        = string
  default     = "skylight"
}

variable "project" {
  description = "The name of the project"
  type        = string
  default     = "dibbs"
}

variable "region" {
  type        = string
  description = "The AWS region where resources are created"
  default     = "us-east-1"
}
