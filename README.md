# DIBBs Query Connector

[![codecov](https://codecov.io/gh/CDCgov/phdi/branch/main/graph/badge.svg)](https://codecov.io/gh/CDCgov/phdi)
[![pre-commit](https://img.shields.io/badge/pre--commit-enabled-brightgreen?logo=pre-commit)](https://github.com/pre-commit/pre-commit)
[![Ruff](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/ruff/main/assets/badge/v2.json)](https://github.com/astral-sh/ruff)
[![Test github badge](https://github.com/CDCgov/phdi/actions/workflows/test.yaml/badge.svg)](https://github.com/CDCgov/phdi/actions/workflows/test.yaml)

**General disclaimer** This repository was created for use by CDC programs to collaborate on public health related projects in support of the [CDC mission](https://www.cdc.gov/about/organization/mission.htm). GitHub is not hosted by the CDC, but is a third party website used by CDC and its partners to share information and collaborate on software. CDC use of GitHub does not imply an endorsement of any one particular service, product, or enterprise.

## Overview

This repository is a part of the CDC/USDS [PHDI project](https://cdcgov.github.io/phdi-site/) and seeks to build the DIBBs Query Connector.

The DIBBs Query Connector app offers a REST API for searching for a patient and viewing information tied to your case investigation.

### Problem Scope

Current public health systems that digest, analyze, and respond to data are siloed. Lacking access to actionable data, our national, as well as state, local, and territorial infrastructure, isn’t pandemic-ready. Our objective is to help the CDC best support PHAs in moving towards a modern public health data infrastructure. See our [public website](https://cdcgov.github.io/dibbs-site/) for more details.

DIBBs Query Connector is a sibling project to

* [PHDI](https://github.com/CDCgov/phdi) to further help display, access, and interpret publich health data;
* [PRIME ReportStream](https://reportstream.cdc.gov), which focuses on improving the delivery of COVID-19 test data to public health departments; and
* [PRIME SimpleReport](https://simplereport.gov), which provides a better way for organizations and testing facilities to report COVID-19 rapid tests to public health departments.

## Implementation

**Implementation Support** - Resources to help users implement DIBBs Query Connector tools to manage their data.

- **[Examples](https://github.com/CDCgov/phdi/tree/main/examples)** - Forthcoming!
- **[Tutorials]()** - Forthcoming!

## Documentation

DIBBs Query Connector documentation, including instructions on how to install dependencies and run locally, is currently hosted within the repository, [here](https://github.com/CDCgov/dibbs-query-connector/blob/main/query-connector/README.md).

Access to the production instance of the DIBBs Query Connector is available at [dibbs.cloud/tefca-viewer]().

## Additional Acknowledgments

We mapped the rootnames of the PHDI database to nicknames produced by the aggregation and synthesis of open source work from a number of projects. While we do not employ the packages and wrappers used by the various projects (merely their open source data), we wish to give credit to their various works building collections of nickname mappings. These projects are:

* [Secure Enterprise Master Patient Index](https://github.com/MrCsabaToth/SOEMPI), based on OpenEMPI, conducted by Vanderbilt University
* [Curated Nicknames](https://github.com/carltonnorthern/nicknames), scraped from genealogy webpages and run by Old Dominion University Web Science and Digital Libraries Research Group
* [Simple Public Domain Nickname Mappings](https://github.com/onyxrev/common_nickname_csv), hand collected using various sources
* [Lingua En Nickname](https://github.com/brianary/Lingua-EN-Nickname), collected from a series of GenWeb projects
* [diminutives.db](https://github.com/HaJongler/diminutives.db), compiled via a nickname extract using Wikipedia and Wiktionary

## Standard Notices

### Public Domain Standard Notice

This repository constitutes a work of the United States Government and is not
subject to domestic copyright protection under 17 USC § 105. This repository is in
the public domain within the United States, and copyright and related rights in
the work worldwide are waived through the [CC0 1.0 Universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/).
All contributions to this repository will be released under the CC0 dedication. By
submitting a pull request you are agreeing to comply with this waiver of
copyright interest.

### License Standard Notice

This project is in the public domain within the United States, and copyright and
related rights in the work worldwide are waived through the [CC0 1.0 Universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/).
All contributions to this project will be released under the CC0 dedication. By
submitting a pull request or issue, you are agreeing to comply with this waiver
of copyright interest and acknowledge that you have no expectation of payment,
unless pursuant to an existing contract or agreement.

### Privacy Standard Notice

This repository contains only non-sensitive, publicly available data and
information. All material and community participation is covered by the
[Disclaimer](https://github.com/CDCgov/template/blob/master/DISCLAIMER.md)
and [Code of Conduct](https://github.com/CDCgov/template/blob/master/code-of-conduct.md).
For more information about CDC's privacy policy, please visit [http://www.cdc.gov/other/privacy.html](https://www.cdc.gov/other/privacy.html).

### Contributing Standard Notice

Anyone is encouraged to contribute to the repository by [forking](https://help.github.com/articles/fork-a-repo)
and submitting a pull request. (If you are new to GitHub, you might start with a
[basic tutorial](https://help.github.com/articles/set-up-git).) By contributing
to this project, you grant a world-wide, royalty-free, perpetual, irrevocable,
non-exclusive, transferable license to all users under the terms of the
[Apache Software License v2](http://www.apache.org/licenses/LICENSE-2.0.html) or
later.

All comments, messages, pull requests, and other submissions received through
CDC including this GitHub page may be subject to applicable federal law, including but not limited to the Federal Records Act, and may be archived. Learn more at [http://www.cdc.gov/other/privacy.html](http://www.cdc.gov/other/privacy.html).

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for more information.

### Records Management Standard Notice

This repository is not a source of government records, but is a copy to increase
collaboration and collaborative potential. All government records will be
published through the [CDC web site](http://www.cdc.gov).

### Related documents

- [Open Practices](docs/open_practices.md)
- [Rules of Behavior](docs/rules_of_behavior.md)
- [Disclaimer](docs/DISCLAIMER.md)
- [Contribution Notice](docs/CONTRIBUTING.md)
- [Code of Conduct](docs/code-of-conduct.md)

### Additional Standard Notices

Please refer to [CDC&#39;s Template Repository](https://github.com/CDCgov/template)
for more information about [contributing to this repository](https://github.com/CDCgov/template/blob/master/CONTRIBUTING.md),
[public domain notices and disclaimers](https://github.com/CDCgov/template/blob/master/DISCLAIMER.md),
and [code of conduct](https://github.com/CDCgov/template/blob/master/code-of-conduct.md).
