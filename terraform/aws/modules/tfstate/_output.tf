output "state_bucket" {
  value = aws_s3_bucket.tfstate
}

output "dynamodb_table" {
  value = aws_dynamodb_table.tfstate_lock
}