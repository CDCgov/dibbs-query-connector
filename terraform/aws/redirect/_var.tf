variable "domain" {
  description = "Retired hostname to redirect. Its Route 53 hosted zone must already exist in the AWS account."
  type        = string
  default     = "queryconnector.dev"
}

variable "target_url" {
  description = "Where requests are redirected. The request path is appended."
  type        = string
  default     = "https://connector.dibbs.tools"
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
