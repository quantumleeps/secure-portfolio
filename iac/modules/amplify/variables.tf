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

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}
