variable "oidc_github_repo" {
  description = "The GitHub repository for OIDC"
  type        = string
  default     = ""
  validation {
    condition     = length(var.oidc_github_repo) == 0 || can(regex("^[a-zA-Z0-9-]+/[a-zA-Z0-9-]+$", var.oidc_github_repo))
    error_message = "oidc_github_repo must be set with 'org/repo' format or blank"
  }
}

variable "owner" {
  description = "The owner of the project"
  type        = string
  default     = "skylight"
  validation {
    condition     = can(regex("^[[:alnum:]]{1,8}$", var.owner))
    error_message = "owner must be 8 characters or less, all lowercase with no special characters or spaces"
  }
}

variable "project" {
  description = "The name of the project"
  type        = string
  default     = "dibbs"
}

variable "region" {
  type        = string
  description = "The AWS region where resources are created"
  default     = ""
  validation {
    condition     = can(regex("^(us|eu|ap|sa|ca|cn|af|me|eu)-[[:alnum:]]{2,10}-[0-9]$", var.region))
    error_message = "region must be a valid AWS region"
  }
}

variable "workspace" {
  default     = ""
  type        = string
  description = "terraform workspace that OIDC will have permissions to"
}

variable "vpc_id" {
  type        = string
  description = "ID of the VPC"
  default     = ""
}

variable "state_bucket_arn" {
  type        = string
  description = "The ARN of the S3 bucket for state"
  default     = ""
}

variable "dynamodb_table_arn" {
  type        = string
  description = "The ARN of the DynamoDB table for state"
  default     = ""
}