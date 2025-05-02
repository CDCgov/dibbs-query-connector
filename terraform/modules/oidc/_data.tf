
data "aws_caller_identity" "current" {}

# # create a role that can be assumed to pull and push docker images from 
data "aws_iam_policy_document" "github_assume_role" {
  statement {
    principals {
      type        = "Federated"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/token.actions.githubusercontent.com"]
    }
    actions = [
      "sts:AssumeRoleWithWebIdentity"
    ]
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com", ]
    }
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values = [
        "repo:${var.oidc_github_repo}:*",
      ]
    }
  }
}

# tfstate and storage policy
# trivy:ignore:AVD-AWS-0057
# trivy:ignore:AVD-AWS-0345
data "aws_iam_policy_document" "storage" {
  statement {
    actions = [
      "dynamodb:DeleteItem",
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "s3:*",
    ]
    resources = [
      "arn:aws:s3:::*",
      var.state_bucket_arn,
      "${var.state_bucket_arn}/*",
      var.dynamodb_table_arn,
    ]
  }
}

# Wildcard policy
# trivy:ignore:AVD-AWS-0057
data "aws_iam_policy_document" "wildcard" {
  statement {
    actions = [
      "acm:ListCertificates",
      "acm:DescribeCertificate",
      "acm:GetCertificate",
      "acm:ListTagsForCertificate",
      "application-autoscaling:DescribeScalableTargets",
      "application-autoscaling:DescribeScalingPolicies",
      "application-autoscaling:ListTagsForResource",
      "ec2:DescribeAddresses",
      "ec2:DescribeVpcEndpoints",
      "ec2:DescribePrefixLists",
      "ec2:DescribeAddressesAttribute",
      "ec2:DescribeFlowLogs",
      "ec2:DescribeInternetGateways",
      "ec2:DescribeNatGateways",
      "ec2:DescribeNetworkAcls",
      "ec2:DescribeNetworkInterfaces",
      "ec2:DescribeRouteTables",
      "ec2:DescribeSecurityGroupRules",
      "ec2:DescribeSecurityGroups",
      "ec2:DescribeSubnets",
      "ec2:DescribeVpcs",
      "ecr:GetAuthorizationToken",
      "ecs:DeregisterTaskDefinition",
      "ecs:DescribeTaskDefinition",
      "elasticloadbalancing:DescribeListeners",
      "elasticloadbalancing:DescribeLoadBalancerAttributes",
      "elasticloadbalancing:DescribeLoadBalancers",
      "elasticloadbalancing:DescribeRules",
      "elasticloadbalancing:DescribeTags",
      "elasticloadbalancing:DescribeTargetGroupAttributes",
      "elasticloadbalancing:DescribeTargetGroups",
      "iam:ListPolicies",
      "route53:CreateHostedZone",
      "secretsmanager:GetSecretValue",
    ]
    resources = [
      "*"
    ]
  }
}

# Scoped policies
# trivy:ignore:AVD-AWS-0057
data "aws_iam_policy_document" "scoped_one" {
  statement {
    actions = [
      "appmesh:DescribeMesh",
      "appmesh:DescribeVirtualNode",
      "appmesh:ListTagsForResource",
      "ec2:DescribeVpcAttribute",
      "ecr:DescribeRepositories",
      "ecr:ListTagsForResource",
      "ecs:DescribeClusters",
      "ecs:DescribeServices",
      "iam:GetPolicy",
      "iam:GetPolicyVersion",
      "iam:GetRole",
      "iam:ListAttachedRolePolicies",
      "iam:ListInstanceProfilesForRole",
      "iam:ListPolicyVersions",
      "iam:ListRolePolicies",
      "logs:DescribeLogGroups",
      "logs:ListAttachedRolePolicies",
      "logs:ListTagsLogGroup",
      "logs:ListTagsForResource",
      "servicediscovery:GetNamespace",
      "servicediscovery:GetOperation",
      "servicediscovery:ListTagsForResource",
    ]
    resources = [
      "arn:aws:appmesh:${var.region}:${data.aws_caller_identity.current.account_id}:mesh/${local.project_owner_workspace}",
      "arn:aws:appmesh:${var.region}:${data.aws_caller_identity.current.account_id}:mesh/${local.project_owner_workspace}/*",
      "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:*",
      "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:*/*",
      "arn:aws:ecs:${var.region}:${data.aws_caller_identity.current.account_id}:*",
      "arn:aws:ecs:${var.region}:${data.aws_caller_identity.current.account_id}:*/*",
      "arn:aws:ecr:${var.region}:${data.aws_caller_identity.current.account_id}:*",
      "arn:aws:ecr:${var.region}:${data.aws_caller_identity.current.account_id}:repository/*",
      "arn:aws:elasticloadbalancing:${var.region}:${data.aws_caller_identity.current.account_id}:*",
      "arn:aws:elasticloadbalancing:${var.region}:${data.aws_caller_identity.current.account_id}:*/*",
      "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${local.project_owner_workspace}*",
      "arn:aws:iam::${data.aws_caller_identity.current.account_id}:policy/${local.project_owner_workspace}*",
      "arn:aws:iam::aws:policy/service-role/*",
      "arn:aws:logs:${var.region}:${data.aws_caller_identity.current.account_id}:*",
      "arn:aws:servicediscovery:${var.region}:${data.aws_caller_identity.current.account_id}:*",
      "arn:aws:servicediscovery:${var.region}:${data.aws_caller_identity.current.account_id}:*/*",
    ]
  }
}

# Scoped policies
data "aws_iam_policy_document" "scoped_two" {
  statement {
    actions = [
      "application-autoscaling:DeleteScalingPolicy",
      "application-autoscaling:DeregisterScalableTarget",
      "application-autoscaling:PutScalingPolicy",
      "application-autoscaling:RegisterScalableTarget",
      "application-autoscaling:TagResource",
      "ec2:createVpcEndpoint",
      "ec2:CreateFlowLogs",
      "ec2:CreateNatGateway",
      "ec2:CreateNetworkAclEntry",
      "ec2:CreateRoute",
      "ec2:CreateRouteTable",
      "ec2:CreateSecurityGroup",
      "ec2:CreateSubnet",
      "ec2:DeleteNetworkAclEntry",
      "iam:PassRole",
    ]
    resources = [
      "arn:aws:application-autoscaling:${var.region}:${data.aws_caller_identity.current.account_id}:scalable-target/*",
      "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:vpc/${local.vpc_id}",
      "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:vpc-flow-log/*",
      "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:subnet/*",
      "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:route-table/*",
      "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:security-group/*",
      "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:network-acl/*",
      "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:elastic-ip/*",
      "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:natgateway/*",
      "arn:aws:ecr:${var.region}:${data.aws_caller_identity.current.account_id}:repository/*",
      "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${local.project_owner_workspace}*",
      "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:vpc-endpoint/*",
    ]
  }
}

# Request tags/Scoped policy
data "aws_iam_policy_document" "request_tags_create_actions" {
  statement {
    actions = [
      "appmesh:CreateMesh",
      "ec2:createVpcEndpoint",
      "appmesh:CreateVirtualNode",
      "appmesh:DeleteMesh",
      "appmesh:DeleteVirtualNode",
      "appmesh:TagResource",
      "ec2:AllocateAddress",
      "ec2:CreateInternetGateway",
      "ec2:CreateRoute",
      "ec2:CreateTags",
      "ec2:CreateVpc",
      "ecs:CreateCluster",
      "ecs:CreateService",
      "ecr:CreateRepository",
      "elasticloadbalancing:CreateListener",
      "elasticloadbalancing:CreateLoadBalancer",
      "elasticloadbalancing:CreateRule",
      "elasticloadbalancing:CreateTargetGroup",
      "iam:CreatePolicy",
      "iam:CreateRole",
      "logs:CreateLogDelivery",
      "logs:CreateLogGroup",
      "logs:TagResource",
      "servicediscovery:CreatePrivateDnsNamespace",
    ]
    resources = [
      "arn:aws:appmesh:${var.region}:${data.aws_caller_identity.current.account_id}:mesh/${local.project_owner_workspace}",
      "arn:aws:appmesh:${var.region}:${data.aws_caller_identity.current.account_id}:mesh/${local.project_owner_workspace}/*",
      "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:vpc/${local.vpc_id}",
      "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:vpc-endpoint/*",
      "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:vpc-flow-log/*",
      "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:subnet/*",
      "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:route-table/*",
      "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:security-group/*",
      "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:network-acl/*",
      "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:internet-gateway/*",
      "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:natgateway/*",
      "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:elastic-ip/*",
      "arn:aws:ecr:${var.region}:${data.aws_caller_identity.current.account_id}:repository/*",
      "arn:aws:ecs:${var.region}:${data.aws_caller_identity.current.account_id}:service/${local.project_owner_workspace}/*",
      "arn:aws:ecs:${var.region}:${data.aws_caller_identity.current.account_id}:cluster/${local.project_owner_workspace}",
      "arn:aws:elasticloadbalancing:${var.region}:${data.aws_caller_identity.current.account_id}:listener/app/${local.project_owner_workspace}/*",
      "arn:aws:elasticloadbalancing:${var.region}:${data.aws_caller_identity.current.account_id}:loadbalancer/app/${local.project_owner_workspace}/*",
      "arn:aws:elasticloadbalancing:${var.region}:${data.aws_caller_identity.current.account_id}:targetgroup/${local.project_owner_workspace}*/*",
      "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${local.project_owner_workspace}*",
      "arn:aws:iam::${data.aws_caller_identity.current.account_id}:policy/${local.project_owner_workspace}*",
      "arn:aws:logs:${var.region}:${data.aws_caller_identity.current.account_id}:log-group:/${local.project_owner_workspace}:log-stream:",
      "arn:aws:servicediscovery:${var.region}:${data.aws_caller_identity.current.account_id}:*/*",
    ]
    condition {
      test     = "StringEquals"
      variable = "aws:RequestTag/workspace"
      values = [
        var.project,
        var.owner,
        var.workspace
      ]
    }
  }
}

# Resource tags/Scoped policy
data "aws_iam_policy_document" "resource_tags_update_actions" {
  statement {
    actions = [
      "appmesh:TagResource",
      "ec2:AttachInternetGateway",
      "ec2:AuthorizeSecurityGroupEgress",
      "ec2:AuthorizeSecurityGroupIngress",
      "ec2:ReplaceRouteTableAssociation",
      "ec2:RevokeSecurityGroupEgress",
      "ec2:RevokeSecurityGroupIngress",
      "ec2:AssociateRouteTable",
      "ec2:ModifyVpcAttribute",
      "ec2:ModifyVpcEndpoint",
      "ec2:CreateTags",
      "elasticloadbalancing:AddTags",
      "elasticloadbalancing:ModifyLoadBalancerAttributes",
      "elasticloadbalancing:ModifyTargetGroupAttributes",
      "elasticloadbalancing:RemoveTags",
      "elasticloadbalancing:ModifyRule",
      "ecs:RegisterTaskDefinition",
      "ecs:UpdateService",
      "ecs:TagResource",
      "ecs:UntagResource",
      "ecs:ListTagsForResource",
      "ecr:InitiateLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:CompleteLayerUpload",
      "ecr:PutImage",
      "ecr:BatchGetImage",
      "ecr:BatchCheckLayerAvailability",
      "ecr:TagResource",
      "ecr:UntagResource",
      "iam:AttachRolePolicy",
      "iam:TagRole",
      "iam:TagPolicy",
      "iam:UntagPolicy",
      "logs:PutRetentionPolicy",
      "logs:UntagResource",
      "servicediscovery:TagResource",
    ]
    resources = [
      "arn:aws:appmesh:${var.region}:${data.aws_caller_identity.current.account_id}:mesh/${local.project_owner_workspace}",
      "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:vpc/${local.vpc_id}",
      "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:vpc-endpoint/*",
      "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:security-group/*",
      "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:subnet/*",
      "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:route-table/*",
      "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:internet-gateway/*",
      "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:vpc-flow-log/*",
      "arn:aws:ecs:${var.region}:${data.aws_caller_identity.current.account_id}:cluster/${local.project_owner_workspace}",
      "arn:aws:ecs:${var.region}:${data.aws_caller_identity.current.account_id}:service/${local.project_owner_workspace}/*",
      "arn:aws:ecs:${var.region}:${data.aws_caller_identity.current.account_id}:task-definition/*",
      "arn:aws:ecr:${var.region}:${data.aws_caller_identity.current.account_id}:repository/*",
      "arn:aws:elasticloadbalancing:${var.region}:${data.aws_caller_identity.current.account_id}:listener/app/${local.project_owner_workspace}/*",
      "arn:aws:elasticloadbalancing:${var.region}:${data.aws_caller_identity.current.account_id}:listener-rule/app/${local.project_owner_workspace}/*",
      "arn:aws:elasticloadbalancing:${var.region}:${data.aws_caller_identity.current.account_id}:loadbalancer/app/${local.project_owner_workspace}/*",
      "arn:aws:elasticloadbalancing:${var.region}:${data.aws_caller_identity.current.account_id}:targetgroup/${local.project_owner_workspace}*/*",
      "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${local.project_owner_workspace}*",
      "arn:aws:iam::${data.aws_caller_identity.current.account_id}:policy/${local.project_owner_workspace}*",
      "arn:aws:logs:${var.region}:${data.aws_caller_identity.current.account_id}:log-group:/${local.project_owner_workspace}:log-stream:",
      "arn:aws:servicediscovery:${var.region}:${data.aws_caller_identity.current.account_id}:*/*",
    ]
    condition {
      test     = "StringEquals"
      variable = "aws:ResourceTag/workspace"
      values = [
        var.project,
        var.owner,
        var.workspace
      ]
    }
  }
}

# Resource tags/Scoped policy
data "aws_iam_policy_document" "resource_tags_delete_actions" {
  statement {
    actions = [
      "ec2:DisassociateAddress",
      "appmesh:DeleteMesh",
      "appmesh:DeleteVirtualNode",
      "ec2:DeleteFlowLogs",
      "ec2:DeleteNatGateway",
      "ec2:DeleteSecurityGroup",
      "ec2:DeleteSubnet",
      "ecs:DeleteCluster",
      "ecs:DeleteService",
      "ec2:DeleteVpc",
      "ec2:DeleteVpcEndpoints",
      "ec2:DeleteTags",
      "ec2:DisassociateRouteTable",
      "ec2:DeleteRouteTable",
      "ec2:DeleteRoute",
      "ec2:ReleaseAddress",
      "ec2:DetachInternetGateway",
      "ec2:DeleteInternetGateway",
      "ecr:DeleteRepository",
      "elasticloadbalancing:DeleteLoadBalancer",
      "elasticloadbalancing:DeleteTargetGroup",
      "elasticloadbalancing:DeleteRule",
      "elasticloadbalancing:DeleteListener",
      "iam:DetachRolePolicy",
      "iam:DeleteRole",
      "iam:DeletePolicy",
      "logs:DeleteLogGroup",
      "servicediscovery:DeleteNamespace",
    ]
    resources = [
      "arn:aws:appmesh:${var.region}:${data.aws_caller_identity.current.account_id}:mesh/${local.project_owner_workspace}",
      "arn:aws:appmesh:${var.region}:${data.aws_caller_identity.current.account_id}:mesh/${local.project_owner_workspace}/*",
      "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:vpc/${local.vpc_id}",
      "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:route-table/*",
      "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:subnet/*",
      "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:natgateway/*",
      "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:security-group/*",
      "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:vpc-flow-log/*",
      "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:vpc-endpoint/*",
      "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:internet-gateway/*",
      "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:elastic-ip/*",
      "arn:aws:ec2:${var.region}:${data.aws_caller_identity.current.account_id}:network-interface/*",
      "arn:aws:ecs:${var.region}:${data.aws_caller_identity.current.account_id}:service/${local.project_owner_workspace}/*",
      "arn:aws:ecs:${var.region}:${data.aws_caller_identity.current.account_id}:cluster/${local.project_owner_workspace}",
      "arn:aws:ecr:${var.region}:${data.aws_caller_identity.current.account_id}:repository/*",
      "arn:aws:elasticloadbalancing:${var.region}:${data.aws_caller_identity.current.account_id}:listener/app/${local.project_owner_workspace}/*",
      "arn:aws:elasticloadbalancing:${var.region}:${data.aws_caller_identity.current.account_id}:listener-rule/app/${local.project_owner_workspace}/*",
      "arn:aws:elasticloadbalancing:${var.region}:${data.aws_caller_identity.current.account_id}:loadbalancer/app/${local.project_owner_workspace}/*",
      "arn:aws:elasticloadbalancing:${var.region}:${data.aws_caller_identity.current.account_id}:targetgroup/${local.project_owner_workspace}*/*",
      "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${local.project_owner_workspace}*",
      "arn:aws:iam::${data.aws_caller_identity.current.account_id}:policy/${local.project_owner_workspace}*",
      "arn:aws:logs:${var.region}:${data.aws_caller_identity.current.account_id}:log-group:/${local.project_owner_workspace}:log-stream:",
      "arn:aws:servicediscovery:${var.region}:${data.aws_caller_identity.current.account_id}:namespace/*",
    ]
    condition {
      test     = "StringEquals"
      variable = "aws:ResourceTag/workspace"
      values = [
        var.project,
        var.owner,
        var.workspace
      ]
    }
  }
}