output "api_endpoint" {
  description = "API Gateway invoke URL"
  value       = module.api_gateway.invoke_url
}

output "slides_table_name" {
  description = "DynamoDB portfolio-slides table name"
  value       = module.dynamodb_portfolio_slides.table_name
}

output "role_versions_table_name" {
  description = "DynamoDB role-versions table name"
  value       = module.dynamodb_role_versions.table_name
}

output "tracking_links_table_name" {
  description = "DynamoDB tracking-links table name"
  value       = module.dynamodb_tracking_links.table_name
}

output "validate_link_function" {
  description = "validate-link Lambda function name"
  value       = module.lambda_validate_link.function_name
}

output "record_heartbeat_function" {
  description = "record-heartbeat Lambda function name"
  value       = module.lambda_record_heartbeat.function_name
}

output "query_metrics_function" {
  description = "query-metrics Lambda function name"
  value       = module.lambda_query_metrics.function_name
}
