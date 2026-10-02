# AWS ECS deployment (reference)

This tree is the Terraform that ran Query Connector on AWS ECS Fargate as
`queryconnector.dev` until September 2026. That environment was torn down and
nothing in CI applies this code anymore; the deployed instance is now
`connector.dibbs.tools`, defined in [`../azure`](../azure/README.md).

It is kept as a working reference for deploying Query Connector on AWS:

| Path | Purpose |
| --- | --- |
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
