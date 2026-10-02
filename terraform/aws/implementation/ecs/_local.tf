locals {
  vpc_name = "${var.project}-${var.owner}-${terraform.workspace}"
  tags = {
    project   = var.project
    owner     = var.owner
    workspace = terraform.workspace
  }
}
