variable "name" {
  description = "Name for the WAF web ACL"
  type        = string
}

variable "rate_limit" {
  description = "Max requests per 5-minute window per IP before blocking"
  type        = number
  default     = 100
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}
