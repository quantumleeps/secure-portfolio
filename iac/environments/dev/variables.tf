variable "environment" {
  description = "Deployment environment"
  type        = string
}

variable "project" {
  description = "Project name used for resource naming and tagging"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "contact_email" {
  description = "Contact email displayed on the landing page"
  type        = string
  sensitive   = true
}

variable "contact_phone" {
  description = "Contact phone displayed on the landing page"
  type        = string
  sensitive   = true
}
