output "state_bucket_name" {
  description = "S3 bucket for Terraform remote state"
  value       = aws_s3_bucket.terraform_state.id
}

output "github_deployer_role_arn" {
  description = "IAM role ARN for GitHub Actions deployer (prod Terraform)"
  value       = aws_iam_role.github_deployer.arn
}

output "github_prod_operator_role_arn" {
  description = "IAM role ARN for GitHub Actions prod operator"
  value       = aws_iam_role.github_prod_operator.arn
}

output "dev_deployer_access_key_ssm" {
  description = "SSM parameter name for dev deployer access key ID"
  value       = aws_ssm_parameter.dev_deployer_access_key_id.name
}

output "dev_deployer_secret_key_ssm" {
  description = "SSM parameter name for dev deployer secret access key"
  value       = aws_ssm_parameter.dev_deployer_secret_access_key.name
}

output "dev_operator_access_key_ssm" {
  description = "SSM parameter name for dev operator access key ID"
  value       = aws_ssm_parameter.dev_operator_access_key_id.name
}

output "dev_operator_secret_key_ssm" {
  description = "SSM parameter name for dev operator secret access key"
  value       = aws_ssm_parameter.dev_operator_secret_access_key.name
}
