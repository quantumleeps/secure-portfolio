# IAM service role — Amplify needs this for SSR builds and compute.
# AWS recommends AdministratorAccess-Amplify for SSR (WEB_COMPUTE) apps;
# it covers S3, CloudFront, Lambda@Edge, SQS (ISR), IAM, and CloudWatch.
resource "aws_iam_role" "amplify" {
  name = "${var.app_name}-amplify-service-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = [
        "amplify.amazonaws.com",
        "amplify.us-east-1.amazonaws.com",
        "lambda.amazonaws.com",
      ] }
    }]
  })

  tags = var.tags
}

resource "aws_iam_role_policy_attachment" "amplify_admin" {
  role       = aws_iam_role.amplify.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess-Amplify"
}

resource "aws_amplify_app" "this" {
  name         = var.app_name
  repository   = var.repository
  access_token = var.github_access_token
  platform     = "WEB_COMPUTE"

  iam_service_role_arn = aws_iam_role.amplify.arn

  build_spec = <<-EOT
    version: 1
    applications:
      - appRoot: app
        frontend:
          phases:
            preBuild:
              commands:
                - npm ci
            build:
              commands:
                - npm run build
          artifacts:
            baseDirectory: .next
            files:
              - '**/*'
          cache:
            paths:
              - node_modules/**/*
              - .next/cache/**/*
  EOT

  environment_variables = var.environment_variables
  tags                  = var.tags
}

resource "aws_amplify_branch" "this" {
  app_id      = aws_amplify_app.this.id
  branch_name = var.branch_name
  framework   = "Next.js - SSR"
  stage       = var.stage

  environment_variables = var.branch_environment_variables
  tags                  = var.tags
}

# Custom domain association — only created when domain_name is provided
resource "aws_amplify_domain_association" "this" {
  count = var.domain_name != "" ? 1 : 0

  app_id                = aws_amplify_app.this.id
  domain_name           = var.domain_name
  wait_for_verification = false

  sub_domain {
    prefix      = ""
    branch_name = aws_amplify_branch.this.branch_name
  }

  sub_domain {
    prefix      = "www"
    branch_name = aws_amplify_branch.this.branch_name
  }
}
