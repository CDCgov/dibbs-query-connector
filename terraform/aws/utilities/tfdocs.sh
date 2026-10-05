#!/bin/bash

terraform-docs markdown table --output-file README.md --output-mode inject ../modules/oidc
terraform-docs markdown table --output-file README.md --output-mode inject ../modules/tfstate
terraform-docs markdown table --output-file README.md --output-mode inject ../implementation/ecs
terraform-docs markdown table --output-file README.md --output-mode inject ../implementation/setup
