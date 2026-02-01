terraform {
  backend "s3" {
    bucket         = "secure-portfolio-terraform-state"
    key            = "environments/dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "secure-portfolio-terraform-locks"
    encrypt        = true
    profile        = "secure-portfolio"
  }
}
