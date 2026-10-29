terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.56.1"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.9.1"
    }
  }
  required_version = "~> 1.9.0"
}
