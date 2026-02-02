output "app_id" {
  description = "Amplify app ID (used by GitHub Actions to trigger deploys)"
  value       = aws_amplify_app.this.id
}

output "default_domain" {
  description = "Amplify default domain (*.amplifyapp.com)"
  value       = aws_amplify_app.this.default_domain
}
