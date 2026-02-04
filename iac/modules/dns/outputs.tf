output "zone_id" {
  description = "Route 53 hosted zone ID"
  value       = aws_route53_zone.this.zone_id
}

output "name_servers" {
  description = "NS records — update your domain registrar to point to these"
  value       = aws_route53_zone.this.name_servers
}
