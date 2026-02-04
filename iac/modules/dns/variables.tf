variable "domain_name" {
  description = "Domain name for the Route 53 hosted zone"
  type        = string
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}
