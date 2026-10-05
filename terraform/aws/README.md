# AWS ECS deployment (reference)

This tree is the Terraform that ran Query Connector on AWS ECS Fargate as
`queryconnector.dev` until September 2026. That environment was torn down and
nothing in CI applies this code anymore; the deployed instance is now
`connector.dibbs.tools`, defined in [`../azure`](../azure/README.md). The one
exception is [`redirect`](#queryconnectordev-redirect), which is live and keeps
the old hostname pointing at the new one.

It is kept as a working reference for deploying Query Connector on AWS:

| Path | Purpose |
| --- | --- |
| `redirect` | Live: permanent redirect from `queryconnector.dev` to `connector.dibbs.tools` (see below) |
| `implementation/setup` | One-time bootstrap: S3 bucket and DynamoDB table for state (`modules/tfstate`) and an IAM role for GitHub OIDC (`modules/oidc`) |
| `implementation/ecs` | VPC, ECS cluster and services (Query Connector, Keycloak, Aidbox), ALB, RDS Postgres, bastion host |
| `modules/oidc`, `modules/tfstate` | Modules used by `setup` |
| `utilities` | Helper scripts for `terraform fmt`, `tflint` and `terraform-docs` across these roots |

Before reusing it, note what was specific to the old environment and would need
to change: the ACM certificate lookup and `APP_HOSTNAME` are hard-coded to
`queryconnector.dev` in `implementation/ecs/main.tf`, the bastion AMI is
us-east-1 only, every secret is passed to the task definition as a plain
environment variable, and the ECS module is pinned to a commit of
`CDCgov/terraform-aws-dibbs-ecr-viewer`. The `implementation/ecs/README.md`
describes an older version of the module inputs.

## queryconnector.dev redirect

`redirect` answers every request to `https://queryconnector.dev` with a 301 to
the same path on `https://connector.dibbs.tools` (query strings are dropped).
It is a CloudFront distribution whose viewer-request function returns the
redirect, an ACM certificate that renews on its own through DNS validation, and
A/AAAA alias records in the existing `queryconnector.dev` Route 53 zone. Every
`.dev` domain is on the HSTS preload list, so browsers only ever request it over
HTTPS and the certificate is required.

The domain's registration is not managed here. The Route 53 hosted zone was
created alongside the old ECS environment and is only read by this stack.

Nothing in CI applies it. To apply, you need AWS credentials for the account
that holds the hosted zone, plus `az login`, because state is stored with the
rest of the Query Connector state in the shared `dibbsstatestorage` account:

```bash
az login
cd terraform/aws/redirect
terraform init
terraform apply
curl -sI https://queryconnector.dev/docs | grep -i '^location'
```
