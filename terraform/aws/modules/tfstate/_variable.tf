variable "owner" {
  description = "The owner of the project"
  type        = string
  default     = "skylight"
  validation {
    condition     = can(regex("^[[:alnum:]]{1,8}$", var.owner))
    error_message = "owner must be 8 characters/numbers or less, all lowercase with no special characters or spaces"
  }
}

variable "project" {
  description = "The name of the project"
  type        = string
  default     = "dibbs"
}

variable "identifier" {
  type    = string
  default = ""
  validation {
    condition     = can(regex("^[[:alnum:]]{1,8}$", var.identifier))
    error_message = "identifier must be 8 characters or less, all lowercase with no special characters or spaces"
  }
}