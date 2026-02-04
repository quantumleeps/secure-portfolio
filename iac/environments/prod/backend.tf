terraform {
  backend "s3" {
    bucket         = "secure-portfolio-terraform-state"
    key            = "environments/prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    use_lockfile   = true
    # No profile — credentials provided by OIDC in CI/CD or AWS_PROFILE env var locally
  }
}
