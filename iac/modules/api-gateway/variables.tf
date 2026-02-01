variable "api_name" {
  description = "Name of the HTTP API"
  type        = string
}

variable "stage_name" {
  description = "API Gateway stage name"
  type        = string
}

variable "cors_allow_origins" {
  description = "Allowed CORS origins"
  type        = list(string)
  default     = ["*"]
}

variable "cors_allow_methods" {
  description = "Allowed CORS methods"
  type        = list(string)
  default     = ["GET", "POST", "OPTIONS"]
}

variable "cors_allow_headers" {
  description = "Allowed CORS headers"
  type        = list(string)
  default     = ["content-type"]
}

variable "routes" {
  description = "List of route-to-Lambda mappings"
  type = list(object({
    route_key    = string
    function_arn = string
    invoke_arn   = string
  }))
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}
