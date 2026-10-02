terraform {
  backend "s3" {}
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.56.1"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6.3"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.5.0"
    }
  }
  required_version = "~> 1.9.0"
}

provider "aws" {
  region = "us-east-1"
  default_tags {
    tags = {
      owner       = "skylight"
      environment = "tfstate"
      project     = "dibbs"
    }
  }
}
