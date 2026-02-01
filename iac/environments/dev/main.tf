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
  region  = var.aws_region
  profile = "secure-portfolio"
}

locals {
  prefix = "${var.project}-${var.environment}"
  common_tags = {
    Project     = var.project
    Environment = var.environment
  }
  lambda_src_base = "${path.module}/../../lambdas/dist"
}

# --- DynamoDB Tables ---

module "dynamodb_portfolio_slides" {
  source     = "../../modules/dynamodb"
  table_name = "${local.prefix}-portfolio-slides"
  hash_key   = "slide_id"
  tags       = local.common_tags
}

module "dynamodb_role_versions" {
  source     = "../../modules/dynamodb"
  table_name = "${local.prefix}-role-versions"
  hash_key   = "role_version"
  tags       = local.common_tags
}

module "dynamodb_tracking_links" {
  source     = "../../modules/dynamodb"
  table_name = "${local.prefix}-tracking-links"
  hash_key   = "slug"
  tags       = local.common_tags
}

# --- IAM Policy Documents ---

data "aws_iam_policy_document" "validate_link_policy" {
  statement {
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:BatchGetItem",
      "dynamodb:Query",
    ]
    resources = [
      module.dynamodb_portfolio_slides.table_arn,
      module.dynamodb_role_versions.table_arn,
    ]
  }

  statement {
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:UpdateItem",
    ]
    resources = [
      module.dynamodb_tracking_links.table_arn,
    ]
  }
}

data "aws_iam_policy_document" "record_heartbeat_policy" {
  statement {
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:UpdateItem",
    ]
    resources = [
      module.dynamodb_tracking_links.table_arn,
    ]
  }
}

data "aws_iam_policy_document" "query_metrics_policy" {
  statement {
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:Query",
      "dynamodb:Scan",
    ]
    resources = [
      module.dynamodb_tracking_links.table_arn,
    ]
  }
}

# --- Lambda Functions ---

module "lambda_validate_link" {
  source          = "../../modules/lambda"
  function_name   = "${local.prefix}-validate-link"
  source_dir      = "${local.lambda_src_base}/validate-link"
  iam_policy_json = data.aws_iam_policy_document.validate_link_policy.json
  environment_vars = {
    SLIDES_TABLE   = module.dynamodb_portfolio_slides.table_name
    ROLES_TABLE    = module.dynamodb_role_versions.table_name
    TRACKING_TABLE = module.dynamodb_tracking_links.table_name
  }
  tags = local.common_tags
}

module "lambda_record_heartbeat" {
  source          = "../../modules/lambda"
  function_name   = "${local.prefix}-record-heartbeat"
  source_dir      = "${local.lambda_src_base}/record-heartbeat"
  iam_policy_json = data.aws_iam_policy_document.record_heartbeat_policy.json
  environment_vars = {
    TRACKING_TABLE = module.dynamodb_tracking_links.table_name
  }
  tags = local.common_tags
}

module "lambda_query_metrics" {
  source          = "../../modules/lambda"
  function_name   = "${local.prefix}-query-metrics"
  source_dir      = "${local.lambda_src_base}/query-metrics"
  iam_policy_json = data.aws_iam_policy_document.query_metrics_policy.json
  environment_vars = {
    TRACKING_TABLE = module.dynamodb_tracking_links.table_name
  }
  tags = local.common_tags
}

# --- API Gateway ---

module "api_gateway" {
  source     = "../../modules/api-gateway"
  api_name   = "${local.prefix}-api"
  stage_name = var.environment
  tags       = local.common_tags

  cors_allow_origins = ["*"]
  cors_allow_methods = ["GET", "POST", "OPTIONS"]
  cors_allow_headers = ["content-type"]

  routes = [
    {
      route_key    = "GET /api/portfolio"
      function_arn = module.lambda_validate_link.function_arn
      invoke_arn   = module.lambda_validate_link.invoke_arn
    },
    {
      route_key    = "POST /api/heartbeat"
      function_arn = module.lambda_record_heartbeat.function_arn
      invoke_arn   = module.lambda_record_heartbeat.invoke_arn
    },
    {
      route_key    = "GET /api/metrics"
      function_arn = module.lambda_query_metrics.function_arn
      invoke_arn   = module.lambda_query_metrics.invoke_arn
    },
  ]
}
