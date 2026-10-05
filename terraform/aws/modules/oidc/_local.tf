locals {
  github_role_name        = "${var.project}-github-role-${var.owner}-${random_string.oidc.result}"
  project_owner_workspace = "${var.project}-${var.owner}-${var.workspace}"
  wildcard                = "*"
  vpc_id                  = var.vpc_id == "" ? local.wildcard : var.vpc_id
}