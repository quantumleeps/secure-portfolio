output "state_bucket_name" {
  description = "S3 bucket for Terraform remote state"
  value       = aws_s3_bucket.terraform_state.id
}

output "lock_table_name" {
  description = "DynamoDB table for Terraform state locking"
  value       = aws_dynamodb_table.terraform_locks.name
}

output "deployer_access_key_id" {
  description = "Access key ID for the deployer IAM user"
  value       = aws_iam_access_key.deployer.id
}

output "deployer_secret_access_key" {
  description = "Secret access key for the deployer IAM user"
  value       = aws_iam_access_key.deployer.secret
  sensitive   = true
}
