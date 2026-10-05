# output "qc_db_role_arn" {
#   value = aws_iam_role.db_role_for_tefca_viewer.arn
# }



output "qc_db_connection_string" {
  value     = "postgresql://${aws_db_instance.qc_db.username}:${aws_db_instance.qc_db.password}@${aws_db_instance.qc_db.endpoint}/${aws_db_instance.qc_db.db_name}"
  sensitive = true
}

output "qc_jdbc_db_url" {
  value     = "jdbc:postgresql://${aws_db_instance.qc_db.endpoint}/${aws_db_instance.qc_db.db_name}"
  sensitive = true
}

output "qc_jdbc_db_user" {
  value     = aws_db_instance.qc_db.username
  sensitive = true
}

output "qc_jdbc_db_password" {
  value     = aws_db_instance.qc_db.password
  sensitive = true
}