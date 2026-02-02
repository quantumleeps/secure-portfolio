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

resource "aws_dynamodb_table" "terraform_locks" {
  name         = "secure-portfolio-terraform-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}

# --- Deployer IAM User ---
# This user is used for all Terraform operations in environments (dev, prod).
# Bootstrap itself is run with a main account profile (e.g., AWS_PROFILE=myguy).

data "aws_caller_identity" "current" {}

resource "aws_iam_user" "deployer" {
  name = "secure-portfolio-deployer"
  path = "/deployers/"
}

resource "aws_iam_access_key" "deployer" {
  user = aws_iam_user.deployer.name
}

resource "aws_iam_policy" "deployer" {
  name   = "secure-portfolio-deployer-policy"
  policy = data.aws_iam_policy_document.deployer.json
}

resource "aws_iam_user_policy_attachment" "deployer" {
  user       = aws_iam_user.deployer.name
  policy_arn = aws_iam_policy.deployer.arn
}

data "aws_iam_policy_document" "deployer" {
  # Terraform state access
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
    sid    = "TerraformLocks"
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:DeleteItem",
    ]
    resources = [
      aws_dynamodb_table.terraform_locks.arn,
    ]
  }

  # DynamoDB — project tables
  statement {
    sid    = "DynamoDB"
    effect = "Allow"
    actions = [
      "dynamodb:CreateTable",
      "dynamodb:DeleteTable",
      "dynamodb:DescribeTable",
      "dynamodb:DescribeContinuousBackups",
      "dynamodb:DescribeTimeToLive",
      "dynamodb:ListTagsOfResource",
      "dynamodb:TagResource",
      "dynamodb:UntagResource",
      "dynamodb:UpdateTable",
      "dynamodb:UpdateTimeToLive",
    ]
    resources = [
      "arn:aws:dynamodb:us-east-1:${data.aws_caller_identity.current.account_id}:table/secure-portfolio-*",
    ]
  }

  # Lambda
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
      "arn:aws:lambda:us-east-1:${data.aws_caller_identity.current.account_id}:function:secure-portfolio-*",
    ]
  }

  # API Gateway
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
    resources = [
      "arn:aws:apigateway:us-east-1::/*",
    ]
  }

  # IAM — scoped to project roles
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
      "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/secure-portfolio-*",
    ]
  }

  # Amplify
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

  # SSM — read GitHub token for Amplify
  statement {
    sid    = "SSMReadSecrets"
    effect = "Allow"
    actions = [
      "ssm:GetParameter",
      "ssm:GetParameters",
    ]
    resources = [
      "arn:aws:ssm:us-east-1:${data.aws_caller_identity.current.account_id}:parameter/secure-portfolio/*",
    ]
  }

  # CloudWatch Logs — describe requires wildcard resource
  statement {
    sid       = "CloudWatchLogsDescribe"
    effect    = "Allow"
    actions   = ["logs:DescribeLogGroups"]
    resources = ["*"]
  }

  # CloudWatch Logs — scoped actions
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
      "arn:aws:logs:us-east-1:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/secure-portfolio-*",
      "arn:aws:logs:us-east-1:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/secure-portfolio-*:*",
      "arn:aws:logs:us-east-1:${data.aws_caller_identity.current.account_id}:log-group:/aws/amplify/secure-portfolio-*",
      "arn:aws:logs:us-east-1:${data.aws_caller_identity.current.account_id}:log-group:/aws/amplify/secure-portfolio-*:*",
    ]
  }
}

# --- Operator IAM User ---
# Used for application operations: CLI scripts (manage-links, view-metrics, seed),
# triggering Amplify builds. Separate from deployer (infrastructure-only).

resource "aws_iam_user" "operator" {
  name = "secure-portfolio-operator"
  path = "/operators/"
}

resource "aws_iam_access_key" "operator" {
  user = aws_iam_user.operator.name
}

resource "aws_iam_policy" "operator" {
  name   = "secure-portfolio-operator-policy"
  policy = data.aws_iam_policy_document.operator.json
}

resource "aws_iam_user_policy_attachment" "operator" {
  user       = aws_iam_user.operator.name
  policy_arn = aws_iam_policy.operator.arn
}

data "aws_iam_policy_document" "operator" {
  # DynamoDB — data access for CLI scripts
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
      "arn:aws:dynamodb:us-east-1:${data.aws_caller_identity.current.account_id}:table/secure-portfolio-*",
    ]
  }

  # Amplify — trigger builds
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
