# Data Integration Building Blocks Azure Templates

# Overview

The Data Integration Building Blocks (DIBBs) project is an effort to help state, local, territorial, and tribal public health departments better make sense of and utilize their data. You can read more about the project on the [main DIBBs repository](https://github.com/CDCgov/phdi/blob/main/README.md).

This repository is intended to provide an operational starting point for instantiating a fully-incorporated, self-sustained Azure environment that will run the DIBBs eCR Viewer pipeline. It can be deployed in full for users who wish to start an environment from scratch, or its several parts can be used to augment an existing Azure environment.

# Prerequisites

## Worker/Agent Prerequisites
The machine or deployment agent that will run this code must have the following tools installed:
* Terraform version 1.7.4 or later.
* Microsoft Azure CLI
* Docker Engine with standard Unix socket configuration (custom locations will require modification of configuration files)
* Git

## Cloud Prerequisites
The target Azure subscription must have the following:
* An existing Resource Group and Storage Account to store Terraform state files
* A Service Principal with Contributor access to the Resource Group (or an engineer with equivalent or greater access, if running from a personal machine)
* Active Azure resource providers for the services being deployed (e.g., Azure App Gateway, Azure Container Apps, etc.)

# Deployment
User-modifiable code exists in the `implementation_aca` folder. Be sure to review `_config.tf` and `main.tf` for variables and inputs that can be customized to fit your installation.

Before you deploy, ensure that you have the prerequisites installed and configured. Then, run the following commands in the `implementation_aca` folder:
    
```bash
terraform init
terraform plan
```
Ensure there are no configuration errors, and review the plan output to confirm that the resources to be created are as expected. If everything looks good, run:

```bash
terraform apply
```

# Deployment Sample
The `dev` folder contains a working sample of a fully-configured environment. You can use this as a reference for your own deployment.


# Notices and Disclaimers

This repository constitutes a work of the United States Government and is not
subject to domestic copyright protection under 17 USC § 105. This repository is in
the public domain within the United States, and copyright and related rights in
the work worldwide are waived through the [CC0 1.0 Universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/).
All contributions to this repository will be released under the CC0 dedication. By
submitting a pull request you are agreeing to comply with this waiver of
copyright interest.

This source code in this repository is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE. See the Apache Software License for more details.

This repository is not a source of government records, but is a copy to increase collaboration and collaborative potential. All government records will be published through the [CDC web site](http://www.cdc.gov).

Contributions to and use of this repository are governed by the [Code of Conduct](code-of-conduct.md), [License](LICENSE), and [Contributing](CONTRIBUTING.md) documents. See [DISLAIMER.md](DISLAIMER.md) for additional disclaimers and legal information.

Please refer to [CDC's Template Repository](https://github.com/CDCgov/template) for more information about [contributing to this repository](https://github.com/CDCgov/template/blob/main/CONTRIBUTING.md), [public domain notices and disclaimers](https://github.com/CDCgov/template/blob/main/DISCLAIMER.md), and [code of conduct](https://github.com/CDCgov/template/blob/main/code-of-conduct.md).