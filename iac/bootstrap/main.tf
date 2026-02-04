terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

data "aws_caller_identity" "current" {}

locals {
  account_id = data.aws_caller_identity.current.account_id
}

# =============================================================================
# Terraform State
# =============================================================================

resource "aws_s3_bucket" "terraform_state" {
  bucket        = "secure-portfolio-terraform-state"
  force_destroy = false
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# =============================================================================
# GitHub Actions OIDC
# =============================================================================
# Enables GitHub Actions workflows to assume IAM roles without static
# credentials. Prod deployments and operations use OIDC exclusively.

resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["ffffffffffffffffffffffffffffffffffffffff"]

  tags = { Project = "secure-portfolio" }
}

# =============================================================================
# OIDC Deployer Role — Prod Terraform
# =============================================================================
# Assumed by GitHub Actions on the main branch to run Terraform for prod.
# Full deployer permissions scoped to secure-portfolio-prod-* resources,
# plus Route 53, WAF, and Amplify domain association.

resource "aws_iam_role" "github_deployer" {
  name = "secure-portfolio-github-deployer"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.github.arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }
        StringLike = {
          "token.actions.githubusercontent.com:sub" = [
            "repo:${var.github_org}/${var.github_repo}:ref:refs/heads/main",
            "repo:${var.github_org}/${var.github_repo}:pull_request"
          ]
        }
      }
    }]
  })

  tags = { Project = "secure-portfolio" }
}

resource "aws_iam_role_policy" "github_deployer" {
  name   = "secure-portfolio-github-deployer-policy"
  role   = aws_iam_role.github_deployer.id
  policy = data.aws_iam_policy_document.github_deployer.json
}

data "aws_iam_policy_document" "github_deployer" {
  statement {
    sid    = "TerraformState"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucket",
    ]
    resources = [
      aws_s3_bucket.terraform_state.arn,
      "${aws_s3_bucket.terraform_state.arn}/*",
    ]
  }

  statement {
    sid    = "DynamoDB"
    effect = "Allow"
    actions = [
      "dynamodb:CreateTable",
      "dynamodb:DeleteTable",
      "dynamodb:DescribeTable",
      "dynamodb:DescribeContinuousBackups",
      "dynamodb:UpdateContinuousBackups",
      "dynamodb:DescribeTimeToLive",
      "dynamodb:ListTagsOfResource",
      "dynamodb:TagResource",
      "dynamodb:UntagResource",
      "dynamodb:UpdateTable",
      "dynamodb:UpdateTimeToLive",
    ]
    resources = [
      "arn:aws:dynamodb:us-east-1:${local.account_id}:table/secure-portfolio-prod-*",
    ]
  }

  statement {
    sid    = "Lambda"
    effect = "Allow"
    actions = [
      "lambda:CreateFunction",
      "lambda:DeleteFunction",
      "lambda:GetFunction",
      "lambda:GetFunctionCodeSigningConfig",
      "lambda:GetPolicy",
      "lambda:ListVersionsByFunction",
      "lambda:UpdateFunctionCode",
      "lambda:UpdateFunctionConfiguration",
      "lambda:AddPermission",
      "lambda:RemovePermission",
      "lambda:TagResource",
      "lambda:UntagResource",
    ]
    resources = [
      "arn:aws:lambda:us-east-1:${local.account_id}:function:secure-portfolio-prod-*",
    ]
  }

  statement {
    sid    = "APIGateway"
    effect = "Allow"
    actions = [
      "apigateway:GET",
      "apigateway:POST",
      "apigateway:PUT",
      "apigateway:PATCH",
      "apigateway:DELETE",
      "apigateway:TagResource",
      "apigateway:UntagResource",
    ]
    resources = ["arn:aws:apigateway:us-east-1::/*"]
  }

  statement {
    sid    = "IAMRoles"
    effect = "Allow"
    actions = [
      "iam:CreateRole",
      "iam:DeleteRole",
      "iam:GetRole",
      "iam:PassRole",
      "iam:TagRole",
      "iam:UntagRole",
      "iam:UpdateRole",
      "iam:UpdateAssumeRolePolicy",
      "iam:AttachRolePolicy",
      "iam:DetachRolePolicy",
      "iam:PutRolePolicy",
      "iam:DeleteRolePolicy",
      "iam:GetRolePolicy",
      "iam:ListRolePolicies",
      "iam:ListAttachedRolePolicies",
      "iam:ListInstanceProfilesForRole",
    ]
    resources = [
      "arn:aws:iam::${local.account_id}:role/secure-portfolio-prod-*",
    ]
  }

  statement {
    sid    = "Amplify"
    effect = "Allow"
    actions = [
      "amplify:CreateApp",
      "amplify:DeleteApp",
      "amplify:GetApp",
      "amplify:UpdateApp",
      "amplify:CreateBranch",
      "amplify:DeleteBranch",
      "amplify:GetBranch",
      "amplify:UpdateBranch",
      "amplify:StartJob",
      "amplify:StopJob",
      "amplify:GetJob",
      "amplify:ListApps",
      "amplify:ListBranches",
      "amplify:ListJobs",
      "amplify:CreateDeployment",
      "amplify:CreateDomainAssociation",
      "amplify:UpdateDomainAssociation",
      "amplify:GetDomainAssociation",
      "amplify:DeleteDomainAssociation",
      "amplify:TagResource",
      "amplify:UntagResource",
      "amplify:ListTagsForResource",
    ]
    resources = ["*"]
  }

  statement {
    sid     = "SSMReadSecrets"
    effect  = "Allow"
    actions = ["ssm:GetParameter", "ssm:GetParameters"]
    resources = [
      "arn:aws:ssm:us-east-1:${local.account_id}:parameter/secure-portfolio/*",
    ]
  }

  statement {
    sid    = "S3ImageBuckets"
    effect = "Allow"
    actions = [
      "s3:CreateBucket",
      "s3:DeleteBucket",
      "s3:GetBucketPolicy",
      "s3:GetBucketAcl",
      "s3:GetBucketCORS",
      "s3:GetBucketVersioning",
      "s3:GetBucketLogging",
      "s3:GetBucketObjectLockConfiguration",
      "s3:GetBucketTagging",
      "s3:GetBucketPublicAccessBlock",
      "s3:GetAccelerateConfiguration",
      "s3:GetBucketRequestPayment",
      "s3:GetBucketWebsite",
      "s3:GetReplicationConfiguration",
      "s3:GetLifecycleConfiguration",
      "s3:GetEncryptionConfiguration",
      "s3:GetBucketOwnershipControls",
      "s3:PutBucketPolicy",
      "s3:PutBucketAcl",
      "s3:PutBucketTagging",
      "s3:PutBucketPublicAccessBlock",
      "s3:PutEncryptionConfiguration",
      "s3:PutBucketVersioning",
      "s3:PutLifecycleConfiguration",
      "s3:PutBucketOwnershipControls",
      "s3:ListBucket",
    ]
    resources = ["arn:aws:s3:::secure-portfolio-prod-portfolio-images"]
  }

  statement {
    sid       = "CloudWatchLogsDescribe"
    effect    = "Allow"
    actions   = ["logs:DescribeLogGroups"]
    resources = ["*"]
  }

  statement {
    sid    = "CloudWatchLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:DeleteLogGroup",
      "logs:PutRetentionPolicy",
      "logs:TagLogGroup",
      "logs:UntagLogGroup",
      "logs:ListTagsLogGroup",
      "logs:ListTagsForResource",
      "logs:TagResource",
      "logs:UntagResource",
    ]
    resources = [
      "arn:aws:logs:us-east-1:${local.account_id}:log-group:/aws/lambda/secure-portfolio-prod-*",
      "arn:aws:logs:us-east-1:${local.account_id}:log-group:/aws/lambda/secure-portfolio-prod-*:*",
      "arn:aws:logs:us-east-1:${local.account_id}:log-group:/aws/amplify/secure-portfolio-prod-*",
      "arn:aws:logs:us-east-1:${local.account_id}:log-group:/aws/amplify/secure-portfolio-prod-*:*",
    ]
  }

  statement {
    sid    = "Route53"
    effect = "Allow"
    actions = [
      "route53:CreateHostedZone",
      "route53:DeleteHostedZone",
      "route53:GetHostedZone",
      "route53:ListHostedZones",
      "route53:ChangeResourceRecordSets",
      "route53:GetChange",
      "route53:ListResourceRecordSets",
      "route53:ListTagsForResource",
      "route53:ChangeTagsForResource",
    ]
    resources = ["*"]
  }

  statement {
    sid    = "WAFv2"
    effect = "Allow"
    actions = [
      "wafv2:CreateWebACL",
      "wafv2:DeleteWebACL",
      "wafv2:GetWebACL",
      "wafv2:UpdateWebACL",
      "wafv2:ListWebACLs",
      "wafv2:ListTagsForResource",
      "wafv2:TagResource",
      "wafv2:UntagResource",
    ]
    resources = ["*"]
  }
}

# =============================================================================
# OIDC Prod Operator Role
# =============================================================================
# Assumed by GitHub Actions on the main branch for prod operations
# (seed, manage-links, image uploads, Amplify builds).

resource "aws_iam_role" "github_prod_operator" {
  name = "secure-portfolio-prod-github-operator"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Federated = aws_iam_openid_connect_provider.github.arn
      }
      Action = "sts:AssumeRoleWithWebIdentity"
      Condition = {
        StringEquals = {
          "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        }
        StringLike = {
          "token.actions.githubusercontent.com:sub" = "repo:${var.github_org}/${var.github_repo}:ref:refs/heads/main"
        }
      }
    }]
  })

  tags = { Project = "secure-portfolio" }
}

resource "aws_iam_role_policy" "github_prod_operator" {
  name   = "secure-portfolio-prod-github-operator-policy"
  role   = aws_iam_role.github_prod_operator.id
  policy = data.aws_iam_policy_document.github_prod_operator.json
}

data "aws_iam_policy_document" "github_prod_operator" {
  statement {
    sid    = "DynamoDBData"
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:BatchWriteItem",
      "dynamodb:Scan",
    ]
    resources = [
      "arn:aws:dynamodb:us-east-1:${local.account_id}:table/secure-portfolio-prod-*",
    ]
  }

  statement {
    sid    = "S3ImageUpload"
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:GetObject",
      "s3:DeleteObject",
      "s3:ListBucket",
    ]
    resources = [
      "arn:aws:s3:::secure-portfolio-prod-portfolio-images",
      "arn:aws:s3:::secure-portfolio-prod-portfolio-images/*",
    ]
  }

  statement {
    sid    = "AmplifyDeploy"
    effect = "Allow"
    actions = [
      "amplify:StartJob",
      "amplify:GetJob",
      "amplify:ListJobs",
    ]
    resources = ["*"]
  }
}

# =============================================================================
# Local Dev Deployer IAM User
# =============================================================================
# Used for local Terraform operations against the dev environment only.
# Access keys stored in SSM Parameter Store for secure retrieval.

resource "aws_iam_user" "dev_deployer" {
  name = "secure-portfolio-dev-deployer"
  path = "/deployers/"
}

resource "aws_iam_access_key" "dev_deployer" {
  user = aws_iam_user.dev_deployer.name
}

resource "aws_iam_policy" "dev_deployer" {
  name   = "secure-portfolio-dev-deployer-policy"
  policy = data.aws_iam_policy_document.dev_deployer.json
}

resource "aws_iam_user_policy_attachment" "dev_deployer" {
  user       = aws_iam_user.dev_deployer.name
  policy_arn = aws_iam_policy.dev_deployer.arn
}

data "aws_iam_policy_document" "dev_deployer" {
  statement {
    sid    = "TerraformState"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:ListBucket",
    ]
    resources = [
      aws_s3_bucket.terraform_state.arn,
      "${aws_s3_bucket.terraform_state.arn}/*",
    ]
  }

  statement {
    sid    = "DynamoDB"
    effect = "Allow"
    actions = [
      "dynamodb:CreateTable",
      "dynamodb:DeleteTable",
      "dynamodb:DescribeTable",
      "dynamodb:DescribeContinuousBackups",
      "dynamodb:UpdateContinuousBackups",
      "dynamodb:DescribeTimeToLive",
      "dynamodb:ListTagsOfResource",
      "dynamodb:TagResource",
      "dynamodb:UntagResource",
      "dynamodb:UpdateTable",
      "dynamodb:UpdateTimeToLive",
    ]
    resources = [
      "arn:aws:dynamodb:us-east-1:${local.account_id}:table/secure-portfolio-dev-*",
    ]
  }

  statement {
    sid    = "Lambda"
    effect = "Allow"
    actions = [
      "lambda:CreateFunction",
      "lambda:DeleteFunction",
      "lambda:GetFunction",
      "lambda:GetFunctionCodeSigningConfig",
      "lambda:GetPolicy",
      "lambda:ListVersionsByFunction",
      "lambda:UpdateFunctionCode",
      "lambda:UpdateFunctionConfiguration",
      "lambda:AddPermission",
      "lambda:RemovePermission",
      "lambda:TagResource",
      "lambda:UntagResource",
    ]
    resources = [
      "arn:aws:lambda:us-east-1:${local.account_id}:function:secure-portfolio-dev-*",
    ]
  }

  statement {
    sid    = "APIGateway"
    effect = "Allow"
    actions = [
      "apigateway:GET",
      "apigateway:POST",
      "apigateway:PUT",
      "apigateway:PATCH",
      "apigateway:DELETE",
      "apigateway:TagResource",
      "apigateway:UntagResource",
    ]
    resources = ["arn:aws:apigateway:us-east-1::/*"]
  }

  statement {
    sid    = "IAMRoles"
    effect = "Allow"
    actions = [
      "iam:CreateRole",
      "iam:DeleteRole",
      "iam:GetRole",
      "iam:PassRole",
      "iam:TagRole",
      "iam:UntagRole",
      "iam:UpdateRole",
      "iam:UpdateAssumeRolePolicy",
      "iam:AttachRolePolicy",
      "iam:DetachRolePolicy",
      "iam:PutRolePolicy",
      "iam:DeleteRolePolicy",
      "iam:GetRolePolicy",
      "iam:ListRolePolicies",
      "iam:ListAttachedRolePolicies",
      "iam:ListInstanceProfilesForRole",
    ]
    resources = [
      "arn:aws:iam::${local.account_id}:role/secure-portfolio-dev-*",
    ]
  }

  statement {
    sid    = "Amplify"
    effect = "Allow"
    actions = [
      "amplify:CreateApp",
      "amplify:DeleteApp",
      "amplify:GetApp",
      "amplify:UpdateApp",
      "amplify:CreateBranch",
      "amplify:DeleteBranch",
      "amplify:GetBranch",
      "amplify:UpdateBranch",
      "amplify:StartJob",
      "amplify:StopJob",
      "amplify:GetJob",
      "amplify:ListApps",
      "amplify:ListBranches",
      "amplify:ListJobs",
      "amplify:CreateDeployment",
      "amplify:TagResource",
      "amplify:UntagResource",
      "amplify:ListTagsForResource",
    ]
    resources = ["*"]
  }

  statement {
    sid     = "SSMReadSecrets"
    effect  = "Allow"
    actions = ["ssm:GetParameter", "ssm:GetParameters"]
    resources = [
      "arn:aws:ssm:us-east-1:${local.account_id}:parameter/secure-portfolio/*",
    ]
  }

  statement {
    sid    = "S3ImageBuckets"
    effect = "Allow"
    actions = [
      "s3:CreateBucket",
      "s3:DeleteBucket",
      "s3:GetBucketPolicy",
      "s3:GetBucketAcl",
      "s3:GetBucketCORS",
      "s3:GetBucketVersioning",
      "s3:GetBucketLogging",
      "s3:GetBucketObjectLockConfiguration",
      "s3:GetBucketTagging",
      "s3:GetBucketPublicAccessBlock",
      "s3:GetAccelerateConfiguration",
      "s3:GetBucketRequestPayment",
      "s3:GetBucketWebsite",
      "s3:GetReplicationConfiguration",
      "s3:GetLifecycleConfiguration",
      "s3:GetEncryptionConfiguration",
      "s3:GetBucketOwnershipControls",
      "s3:PutBucketPolicy",
      "s3:PutBucketAcl",
      "s3:PutBucketTagging",
      "s3:PutBucketPublicAccessBlock",
      "s3:PutEncryptionConfiguration",
      "s3:PutBucketVersioning",
      "s3:PutLifecycleConfiguration",
      "s3:PutBucketOwnershipControls",
      "s3:ListBucket",
    ]
    resources = ["arn:aws:s3:::secure-portfolio-dev-portfolio-images"]
  }

  statement {
    sid       = "CloudWatchLogsDescribe"
    effect    = "Allow"
    actions   = ["logs:DescribeLogGroups"]
    resources = ["*"]
  }

  statement {
    sid    = "CloudWatchLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:DeleteLogGroup",
      "logs:PutRetentionPolicy",
      "logs:TagLogGroup",
      "logs:UntagLogGroup",
      "logs:ListTagsLogGroup",
      "logs:ListTagsForResource",
      "logs:TagResource",
      "logs:UntagResource",
    ]
    resources = [
      "arn:aws:logs:us-east-1:${local.account_id}:log-group:/aws/lambda/secure-portfolio-dev-*",
      "arn:aws:logs:us-east-1:${local.account_id}:log-group:/aws/lambda/secure-portfolio-dev-*:*",
      "arn:aws:logs:us-east-1:${local.account_id}:log-group:/aws/amplify/secure-portfolio-dev-*",
      "arn:aws:logs:us-east-1:${local.account_id}:log-group:/aws/amplify/secure-portfolio-dev-*:*",
    ]
  }
}

# =============================================================================
# Local Dev Operator IAM User
# =============================================================================
# Used for local CLI scripts (manage-links, view-metrics, seed) against dev.
# Prod operations go through the OIDC operator role via GitHub Actions.

resource "aws_iam_user" "dev_operator" {
  name = "secure-portfolio-dev-operator"
  path = "/operators/"
}

resource "aws_iam_access_key" "dev_operator" {
  user = aws_iam_user.dev_operator.name
}

resource "aws_iam_policy" "dev_operator" {
  name   = "secure-portfolio-dev-operator-policy"
  policy = data.aws_iam_policy_document.dev_operator.json
}

resource "aws_iam_user_policy_attachment" "dev_operator" {
  user       = aws_iam_user.dev_operator.name
  policy_arn = aws_iam_policy.dev_operator.arn
}

data "aws_iam_policy_document" "dev_operator" {
  statement {
    sid    = "DynamoDBData"
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:BatchWriteItem",
      "dynamodb:Scan",
    ]
    resources = [
      "arn:aws:dynamodb:us-east-1:${local.account_id}:table/secure-portfolio-dev-*",
    ]
  }

  statement {
    sid    = "S3ImageUpload"
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:GetObject",
      "s3:DeleteObject",
      "s3:ListBucket",
    ]
    resources = [
      "arn:aws:s3:::secure-portfolio-dev-portfolio-images",
      "arn:aws:s3:::secure-portfolio-dev-portfolio-images/*",
    ]
  }

  statement {
    sid    = "AmplifyDeploy"
    effect = "Allow"
    actions = [
      "amplify:StartJob",
      "amplify:GetJob",
      "amplify:ListJobs",
    ]
    resources = ["*"]
  }
}

# =============================================================================
# SSM Parameters — Access Key Storage
# =============================================================================
# Access keys for local dev users stored as SecureString. Retrieve with:
#   aws ssm get-parameter --name /secure-portfolio/dev-deployer-access-key-id \
#     --with-decryption --profile <admin-profile>

resource "aws_ssm_parameter" "dev_deployer_access_key_id" {
  name  = "/secure-portfolio/dev-deployer-access-key-id"
  type  = "SecureString"
  value = aws_iam_access_key.dev_deployer.id
  tags  = { Project = "secure-portfolio" }
}

resource "aws_ssm_parameter" "dev_deployer_secret_access_key" {
  name  = "/secure-portfolio/dev-deployer-secret-access-key"
  type  = "SecureString"
  value = aws_iam_access_key.dev_deployer.secret
  tags  = { Project = "secure-portfolio" }
}

resource "aws_ssm_parameter" "dev_operator_access_key_id" {
  name  = "/secure-portfolio/dev-operator-access-key-id"
  type  = "SecureString"
  value = aws_iam_access_key.dev_operator.id
  tags  = { Project = "secure-portfolio" }
}

resource "aws_ssm_parameter" "dev_operator_secret_access_key" {
  name  = "/secure-portfolio/dev-operator-secret-access-key"
  type  = "SecureString"
  value = aws_iam_access_key.dev_operator.secret
  tags  = { Project = "secure-portfolio" }
}
