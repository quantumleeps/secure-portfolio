variable "app_name" {
  description = "Amplify app name"
  type        = string
}

variable "repository" {
  description = "GitHub repository URL"
  type        = string
}

variable "github_access_token" {
  description = "GitHub personal access token for repo access"
  type        = string
  sensitive   = true
}

variable "branch_name" {
  description = "Git branch to deploy"
  type        = string
  default     = "main"
}

variable "stage" {
  description = "Amplify branch stage (PRODUCTION, BETA, DEVELOPMENT, EXPERIMENTAL)"
  type        = string
  default     = "PRODUCTION"
}

variable "environment_variables" {
  description = "App-level environment variables"
  type        = map(string)
  default     = {}
}

variable "branch_environment_variables" {
  description = "Branch-level environment variables"
  type        = map(string)
  default     = {}
}

variable "domain_name" {
  description = "Custom domain name (leave empty to skip domain association)"
  type        = string
  default     = ""
}

variable "route53_zone_id" {
  description = "Route 53 hosted zone ID for domain verification (required if domain_name is set)"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}
