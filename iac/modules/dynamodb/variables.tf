variable "table_name" {
  description = "Full DynamoDB table name including environment prefix"
  type        = string
}

variable "hash_key" {
  description = "Partition key attribute name"
  type        = string
}

variable "hash_key_type" {
  description = "Partition key attribute type (S, N, or B)"
  type        = string
  default     = "S"
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}
