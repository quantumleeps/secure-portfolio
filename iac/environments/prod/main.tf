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
  region = var.aws_region
  # No profile — credentials provided by OIDC in CI/CD or AWS_PROFILE env var locally
}

locals {
  prefix = "${var.project}-${var.environment}"
  common_tags = {
    Project     = var.project
    Environment = var.environment
  }
  lambda_src_base = "${path.module}/../../lambdas/dist"
}

# --- DNS ---

module "dns" {
  source      = "../../modules/dns"
  domain_name = var.domain_name
  tags        = local.common_tags
}

# --- WAF ---

module "waf" {
  source = "../../modules/waf"
  name   = "${local.prefix}-waf"
  tags   = local.common_tags
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

# --- S3 Image Bucket ---

module "s3_portfolio_images" {
  source      = "../../modules/s3-private"
  bucket_name = "${local.prefix}-portfolio-images"
  tags        = local.common_tags
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

  statement {
    effect  = "Allow"
    actions = ["s3:GetObject"]
    resources = [
      "${module.s3_portfolio_images.bucket_arn}/*",
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

data "aws_iam_policy_document" "refresh_urls_policy" {
  statement {
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:BatchGetItem",
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

  statement {
    effect  = "Allow"
    actions = ["s3:GetObject"]
    resources = [
      "${module.s3_portfolio_images.bucket_arn}/*",
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
    IMAGES_BUCKET  = module.s3_portfolio_images.bucket_name
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

module "lambda_refresh_urls" {
  source          = "../../modules/lambda"
  function_name   = "${local.prefix}-refresh-urls"
  source_dir      = "${local.lambda_src_base}/refresh-urls"
  iam_policy_json = data.aws_iam_policy_document.refresh_urls_policy.json
  environment_vars = {
    SLIDES_TABLE   = module.dynamodb_portfolio_slides.table_name
    ROLES_TABLE    = module.dynamodb_role_versions.table_name
    TRACKING_TABLE = module.dynamodb_tracking_links.table_name
    IMAGES_BUCKET  = module.s3_portfolio_images.bucket_name
  }
  tags = local.common_tags
}

# --- API Gateway ---

module "api_gateway" {
  source     = "../../modules/api-gateway"
  api_name   = "${local.prefix}-api"
  stage_name = var.environment
  tags       = local.common_tags

  cors_allow_origins = ["https://${var.domain_name}", "https://www.${var.domain_name}"]
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
      route_key    = "POST /api/refresh-urls"
      function_arn = module.lambda_refresh_urls.function_arn
      invoke_arn   = module.lambda_refresh_urls.invoke_arn
    },
  ]
}

# --- SSM: GitHub PAT ---

data "aws_ssm_parameter" "github_token" {
  name            = "/secure-portfolio/github-token"
  with_decryption = true
}

# --- Amplify ---

module "amplify" {
  source              = "../../modules/amplify"
  app_name            = "${local.prefix}-frontend"
  repository          = "https://github.com/quantumleeps/secure-portfolio"
  github_access_token = data.aws_ssm_parameter.github_token.value
  branch_name         = "main"
  stage               = "PRODUCTION"
  domain_name         = var.domain_name
  route53_zone_id     = module.dns.zone_id
  tags                = local.common_tags

  environment_variables = {
    AMPLIFY_MONOREPO_APP_ROOT = "app"
    NEXT_PUBLIC_API_ENDPOINT  = module.api_gateway.invoke_url
    CONTACT_EMAIL             = var.contact_email
    CONTACT_PHONE             = var.contact_phone
  }
}
