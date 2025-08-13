#!/bin/bash

# If you're running this code from an M-series processor or other ARM variant, you may need to specify the container platform manually.
export DOCKER_DEFAULT_PLATFORM=linux/amd64

# This section provides an example of targeted deployments, if required for your installation.
terraform apply -target=module.foundations -target=module.networking
terraform apply -target=module.container_apps