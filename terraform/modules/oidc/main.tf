resource "random_string" "oidc" {
  length  = 8
  special = false
  upper   = false
}

resource "aws_iam_policy" "wildcard" {
  name   = "${var.project}-wildcard-policy-${var.owner}-${random_string.oidc.result}"
  policy = data.aws_iam_policy_document.wildcard.json
}

resource "aws_iam_policy" "scoped_one" {
  name   = "${var.project}-scoped-one-policy-${var.owner}-${random_string.oidc.result}"
  policy = data.aws_iam_policy_document.scoped_one.json
}

resource "aws_iam_policy" "scoped_two" {
  name   = "${var.project}-scoped-two-policy-${var.owner}-${random_string.oidc.result}"
  policy = data.aws_iam_policy_document.scoped_two.json
}

resource "aws_iam_policy" "request_tags_create_actions" {
  name   = "${var.project}-request-tags-policy-${var.owner}-${random_string.oidc.result}"
  policy = data.aws_iam_policy_document.request_tags_create_actions.json
}

resource "aws_iam_policy" "resource_tags_update_actions" {
  name   = "${var.project}-resource-tags-update-policy-${var.owner}-${random_string.oidc.result}"
  policy = data.aws_iam_policy_document.resource_tags_update_actions.json
}

resource "aws_iam_policy" "resource_tags_delete_actions" {
  name   = "${var.project}-resource-tags-delete-policy-${var.owner}-${random_string.oidc.result}"
  policy = data.aws_iam_policy_document.resource_tags_delete_actions.json
}

resource "aws_iam_policy" "storage" {
  name   = "${var.project}-storage-policy-${var.owner}-${random_string.oidc.result}"
  policy = data.aws_iam_policy_document.storage.json
}

resource "aws_iam_role" "github" {
  name = local.github_role_name
  managed_policy_arns = [
    aws_iam_policy.wildcard.arn,
    aws_iam_policy.scoped_one.arn,
    aws_iam_policy.scoped_two.arn,
    aws_iam_policy.request_tags_create_actions.arn,
    aws_iam_policy.resource_tags_update_actions.arn,
    aws_iam_policy.resource_tags_delete_actions.arn,
    aws_iam_policy.storage.arn,
  ]
  assume_role_policy = data.aws_iam_policy_document.github_assume_role.json
}