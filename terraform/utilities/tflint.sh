#!/bin/bash

tflint -f compact --chdir ../modules/oidc
tflint -f compact --chdir ../modules/tfstate
tflint -f compact --chdir ../implementation/setup
tflint -f compact --chdir ../implementation/ecs
