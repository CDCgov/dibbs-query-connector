# Changelog

Release notes for v1.0.0 through v1.2.4, carried over from their GitHub Releases. Those release pages were removed during repository maintenance; container images for these versions are still available in [GHCR](https://github.com/CDCgov/dibbs-query-connector/pkgs/container/dibbs-query-connector%2Fquery-connector). Release notes for v1.2.5 and later are on the [Releases page](https://github.com/CDCgov/dibbs-query-connector/releases).

## v1.2.4 (2026-10-15)

### 🏕 Features
* chore: stop tracking next-env.d.ts by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/1050
* Deploy connector.dibbs.tools from this repo with Azure Container Apps and CD on merge to main by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/1041
* fix CSS issues by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/1053
* fix: fail seeding fast with a clear error when VSAC rejects the UMLS key by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/1051
* docs: hand the qc_aidbox public schema to the Aidbox role by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/1052
* Release v1.2.4 by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/1060
### 👒 Dependencies
* chore(deps): bump js-yaml by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/1034
* chore(deps): bump undici from 8.10.0 to 8.11.2 by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/1040
* chore(deps): bump next from 16.3.3 to 16.3.8 by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/1044
* chore(deps-dev): bump @grpc/grpc-js from 1.14.4 to 1.14.5 by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/1043
* chore(deps): bump brace-expansion by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/1042
* chore(deps): bump the minor-and-patch group across 1 directory with 28 updates by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/1046
* chore(deps-dev): bump sass-embedded from 1.105.0 to 1.105.1 in the minor-and-patch group by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/1048
* chore(deps): bump keycloak/keycloak from 26.7 to 26.8 by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/1047
* chore(deps-dev): bump the majors group across 1 directory with 2 updates by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/1049
* chore(deps): bump the minor-and-patch group across 1 directory with 18 updates by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/1057

## v1.2.3 (2026-09-21)

### 🏕 Features
* fix(seeding): only send OID value sets to VSAC so eRSD 3.2.0 seeds cleanly by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/1036
* Release v1.2.3 by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/1037

## v1.2.2 (2026-09-02)

### 🏕 Features
* Rename Query Connector FAQ_Final.pdf to Frequently Asked Questions Gu… by @mattmgoldberg in https://github.com/CDCgov/dibbs-query-connector/pull/1027
* feat: show a DiagnosticReport's referenced result Observations on the results page by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/1030
* Release v1.2.2 by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/1031
### 👒 Dependencies
* chore(deps-dev): bump @types/react-dom from 19.2.4 to 19.2.5 in the minor-and-patch group by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/1029

## v1.2.1 (2026-08-26)

### 🏕 Features
* Add files via upload by @mattmgoldberg in https://github.com/CDCgov/dibbs-query-connector/pull/1019
* chore(deps): combine Dependabot updates (Next 16.3, react-uswds 12, next-auth beta.32, jsdoc 64, undici 8.10 + minors) by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/1023
* fix: send all Epic query strategy searches as GET requests by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/1024
* feat: query ImmunizationRecommendation on Immunization Gateways and surface the FHIR server select by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/1025
* Release v1.2.1 by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/1026

## v1.2.0 (2026-07-22)

### 🏕 Features
* feat: race, ethnicity, and gender patient search parameters by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/1006
* feat: MDRO case investigation demo query and test patient results by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/1007
* Release v1.2.0 by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/1009
### 👒 Dependencies
* Bump the minor-and-patch group with 11 updates by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/1004
* chore(deps): bump the majors group across 1 directory with 3 updates by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/1008

## v1.1.2 (2026-07-17)

### 🏕 Features
* fix: Epic query strategy medication retrieval and display by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/998
* fix: IZ Gateway immunization retrieval via chained patient demographics by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/1002
* Release v1.1.2 by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/1003
### 👒 Dependencies
* Bump the minor-and-patch group with 9 updates by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/1000
* Bump keycloak/keycloak from 26.6 to 26.7 by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/999

## v1.1.1 (2026-07-09)

### 🏕 Features
* perf: Speed up Select Query step with lightweight query summaries by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/993
* perf: Add server-side pagination to Audit Logs page by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/992
* fix: persist SMART on FHIR signing keys in the database by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/994
* fix: mutual-TLS requests broken in v1.1.0 by undici 8 bump by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/995
* fix: replace ts-node with native Node type stripping in e2e setup by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/996
* Release v1.1.1 by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/997

## v1.1.0 (2026-07-08)

### 🏕 Features
* Add Epic query strategy for vendor-compatible patient record searches by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/966
* chore(deps): combine Dependabot updates (Next 16, react 19.2, react-uswds 11, scalar, aws-sdk) by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/972
* chore(deps): combine Dependabot updates (dotenv-cli 11, @types/node 24, sharp 0.35; drop unist-util-visit) by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/978
* chore: group Dependabot npm updates into minor/patch and majors PRs by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/983
* chore: drop unused eslint-plugin-import by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/986
* chore: drop unused eslint-plugin-jsx-a11y by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/987
* test: Expand e2e test coverage across recent features and untested pages by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/989
* test: raise unit test coverage from ~65% to ~80% by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/988
* docs: Update README - refresh screenshot, fix environment URLs and doc links by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/990
* chore: release v1.1.0 by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/991
### 👒 Dependencies
* Bump the minor-and-patch group with 24 updates by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/984
* Bump the majors group across 1 directory with 11 updates by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/985

## v1.0.0 (2026-06-30)

### 🏕 Features
* remove phdi by @DanPaseltiner in https://github.com/CDCgov/dibbs-query-connector/pull/3
* Remove unneeded workflows by @m-goggins in https://github.com/CDCgov/dibbs-query-connector/pull/5
* Remove docs by @DanPaseltiner in https://github.com/CDCgov/dibbs-query-connector/pull/8
* Remove publications by @DanPaseltiner in https://github.com/CDCgov/dibbs-query-connector/pull/7
* Remove all containers other than TEFCA Viewer by @DanPaseltiner in https://github.com/CDCgov/dibbs-query-connector/pull/9
* add design instructions to PR template by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/10
* Remove turbo by @DanPaseltiner in https://github.com/CDCgov/dibbs-query-connector/pull/11
* debug e2es by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/6
* Remove utils directory by @DanPaseltiner in https://github.com/CDCgov/dibbs-query-connector/pull/14
* [pre-commit.ci] pre-commit autoupdate by @pre-commit-ci[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/13
* Remove lighthouse config by @DanPaseltiner in https://github.com/CDCgov/dibbs-query-connector/pull/16
* Remove python tooling by @DanPaseltiner in https://github.com/CDCgov/dibbs-query-connector/pull/15
* Add golden patient data by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/4
* Trust self-signed certificates when using the eHX FHIR proxy by @DanPaseltiner in https://github.com/CDCgov/dibbs-query-connector/pull/18
* Simple ci workflow by @DanPaseltiner in https://github.com/CDCgov/dibbs-query-connector/pull/22
* Add newborn screening codes from CPHI by @m-goggins in https://github.com/CDCgov/dibbs-query-connector/pull/21
* remove secret.out by @DanPaseltiner in https://github.com/CDCgov/dibbs-query-connector/pull/23
* Clean up pre-commit configs by @DanPaseltiner in https://github.com/CDCgov/dibbs-query-connector/pull/24
* move migration 5 to correct location by @m-goggins in https://github.com/CDCgov/dibbs-query-connector/pull/26
* First draft of CD workflow by @DanPaseltiner in https://github.com/CDCgov/dibbs-query-connector/pull/27
* Update cd.yaml by @DanPaseltiner in https://github.com/CDCgov/dibbs-query-connector/pull/28
* Removing old workflows we don't need anymore by @DanPaseltiner in https://github.com/CDCgov/dibbs-query-connector/pull/29
* enable image publishing on merges to main by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/30
* Update .gitignore by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/32
* align customize query flow to design by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/25
* fix design review script by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/33
* Write getVSAC value set by @bamader in https://github.com/CDCgov/dibbs-query-connector/pull/31
* Add `dibbsConceptType` to valuesets table by @m-goggins in https://github.com/CDCgov/dibbs-query-connector/pull/36
* Add internal data model for ValueSet by @m-goggins in https://github.com/CDCgov/dibbs-query-connector/pull/35
* Adding Step Counter to new workflow by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/20
* query flow redirect followup by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/37
* [pre-commit.ci] pre-commit autoupdate by @pre-commit-ci[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/42
* Refactor new data model by @bamader in https://github.com/CDCgov/dibbs-query-connector/pull/43
* Updating eslintrc by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/40
* add translation function: vsac --> internal valueset by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/41
* Adding loading step to customize query selection by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/48
* fix frontend errors by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/50
* Add e2e for customize query by @bamader in https://github.com/CDCgov/dibbs-query-connector/pull/53
* Removing social determinants of health from select query dropdown by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/62
* insert valueset function by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/49
* Rework name regex on patient search page by @katyasoup in https://github.com/CDCgov/dibbs-query-connector/pull/63
* Fix all the e2e stuff by @bamader in https://github.com/CDCgov/dibbs-query-connector/pull/64
* Allow overwriting inserts by @bamader in https://github.com/CDCgov/dibbs-query-connector/pull/91
* Set up local HAPI server for e2e tests by @m-goggins in https://github.com/CDCgov/dibbs-query-connector/pull/90
* define backend query building insert function by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/89
* remove .vscode by @DanPaseltiner in https://github.com/CDCgov/dibbs-query-connector/pull/97
* Adding Category data to Conditions table by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/88
* backend query insertion cleanup by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/101
* New pr template by @DanPaseltiner in https://github.com/CDCgov/dibbs-query-connector/pull/102
* Create json for custom valuesets using internal valueset schema by @m-goggins in https://github.com/CDCgov/dibbs-query-connector/pull/105
* Vs insertion check by @bamader in https://github.com/CDCgov/dibbs-query-connector/pull/108
* Build a basic Sign In page by @katyasoup in https://github.com/CDCgov/dibbs-query-connector/pull/80
* setup routing and empty state query building pages by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/107
* Adding initialization work to display conditions.category and build queries by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/103
* Updating condition category mapping work in database-services by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/112
* Deployment workflow by @shanice-skylight in https://github.com/CDCgov/dibbs-query-connector/pull/109
* [pre-commit.ci] pre-commit autoupdate by @pre-commit-ci[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/113
* Fix Workflow syntax by @shanice-skylight in https://github.com/CDCgov/dibbs-query-connector/pull/115
* Update Header and Footer responsive styles by @katyasoup in https://github.com/CDCgov/dibbs-query-connector/pull/110
* Update DQC main page README by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/114
* query building part one by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/120
* change tefca-viewer --> query-connector by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/126
* DB Creation Funcs by @bamader in https://github.com/CDCgov/dibbs-query-connector/pull/130
* condition template selection page by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/119
* Add loading page for inserting eRSD data into the DB by @m-goggins in https://github.com/CDCgov/dibbs-query-connector/pull/123
* Deployment Workflow variables by @shanice-skylight in https://github.com/CDCgov/dibbs-query-connector/pull/131
* Hook up button to creation script by @bamader in https://github.com/CDCgov/dibbs-query-connector/pull/153
* Add function to check whether valueset data exists in the DB by @m-goggins in https://github.com/CDCgov/dibbs-query-connector/pull/152
* Adding Custom Queries backend by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/133
* Update Copy by @m-goggins in https://github.com/CDCgov/dibbs-query-connector/pull/160
* Replace non-numeric characters in phone numbers with url encoding by @m-goggins in https://github.com/CDCgov/dibbs-query-connector/pull/166
* Update Postman Collection Copy + base_url by @m-goggins in https://github.com/CDCgov/dibbs-query-connector/pull/165
* [pre-commit.ci] pre-commit autoupdate by @pre-commit-ci[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/164
* Save condition selections on template builder page by @katyasoup in https://github.com/CDCgov/dibbs-query-connector/pull/161
* Add Keycloak OAuth login by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/159
* Changing conflicting ports in docker-compose-dev by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/174
* Make sure keycloak port bind is bound to 8080 inside container by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/175
* Dev dump by @bamader in https://github.com/CDCgov/dibbs-query-connector/pull/158
* Update README to include documentation on queryBuilding data by @m-goggins in https://github.com/CDCgov/dibbs-query-connector/pull/177
* componentize query page checkboxes by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/181
* [pre-commit.ci] pre-commit autoupdate by @pre-commit-ci[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/185
* Initializing My Queries page frontend when user queries present by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/168
* Add Copy ID / Delete functionality to My Queries page by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/202
* Add `fhir_servers` table + `getFhirServerConfigs` function by @m-goggins in https://github.com/CDCgov/dibbs-query-connector/pull/203
* Add ValueSet selection page by @katyasoup in https://github.com/CDCgov/dibbs-query-connector/pull/184
* add new columns for query building to query table by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/201
* fix translation methods between query pages by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/214
* tweak toast styles by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/211
* Switch from Public HAPI to HELIOS Meld by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/215
* use flex to size footer, header, and body by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/178
* Adding default drawer for condition selection and concept selection by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/216
* [pre-commit.ci] pre-commit autoupdate by @pre-commit-ci[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/220
* update navigation between query building pages by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/217
* unbreak API by fixing route import by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/228
* update readme by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/227
* turn integration tests back on by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/230
* refactor valueset translation types and functions by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/231
* visual refresh - color tokens by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/238
* query building concept selection part one by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/234
* visual refresh part 2 by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/240
* query building concept selection part two by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/235
* customize query - graceful fallback for empty response by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/242
* Transition Dev environment Infrastructure to ECS by @shanice-skylight in https://github.com/CDCgov/dibbs-query-connector/pull/222
* Frontend Condition List Side Panel by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/245
* translation util  unit tests by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/243
* new content for query building empty state by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/246
* Fix Terraform workflow by @shanice-skylight in https://github.com/CDCgov/dibbs-query-connector/pull/247
* Modify application url to root by @shanice-skylight in https://github.com/CDCgov/dibbs-query-connector/pull/250
* query building write functionality pt 1 by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/256
* move the landing page call-to-action above the fold by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/261
* Demo workspace depolyment by @shanice-skylight in https://github.com/CDCgov/dibbs-query-connector/pull/258
* query building write functionality pt 2 by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/259
* Use DibbsValueSet instead of VsGrouping by @katyasoup in https://github.com/CDCgov/dibbs-query-connector/pull/254
* FHIR Server Configuration by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/248
* adjust homepage and in-app nav by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/264
* add fhir-servers to the list of logged in paths by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/265
* Add site title and favicon by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/266
* Added period after "timely data" on landing page by @mikang in https://github.com/CDCgov/dibbs-query-connector/pull/268
* revert code in accordion header by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/278
* Update base_url for Postman collection to demo.queryconnector.dev by @m-goggins in https://github.com/CDCgov/dibbs-query-connector/pull/281
* Updating input field length on Custom Query page by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/282
* Add basic auth to FHIR server configuration by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/287
* Add immunization query backend by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/292
* [pre-commit.ci] pre-commit autoupdate by @pre-commit-ci[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/274
* replace `use_cases` with queries from the query table by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/297
* Genericize checkIfSomeElementWithPropertyExists to show more available data + add formatCoding by @m-goggins in https://github.com/CDCgov/dibbs-query-connector/pull/302
* Initializing user management table by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/304
* Dedupe FHIR Resources Parsed by Queries by @m-goggins in https://github.com/CDCgov/dibbs-query-connector/pull/306
* Adding additional auth.ts args by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/308
* Use `FhirResource` from `fhir/r4`, not a DIBBS definition by @m-goggins in https://github.com/CDCgov/dibbs-query-connector/pull/313
* Make keycloak work in docker compose by @bamader in https://github.com/CDCgov/dibbs-query-connector/pull/269
* add query building tests by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/263
* add search to conditions and valueset side panels by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/309
* [pre-commit.ci] pre-commit autoupdate by @pre-commit-ci[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/318
* Reorganize app/ directory layout by @katyasoup in https://github.com/CDCgov/dibbs-query-connector/pull/319
* fix state initialization problems by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/326
* add immunization to query table by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/325
* fix backend query typing by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/324
* Compliance with Executive Order 14168 by @dibbs-anon in https://github.com/CDCgov/dibbs-query-connector/pull/336
* Update MRN and Identifier Formatting to include Assigner by @m-goggins in https://github.com/CDCgov/dibbs-query-connector/pull/334
* Landing page semantic enhancements by @johanna-skylight in https://github.com/CDCgov/dibbs-query-connector/pull/337
* Creating backend functions for user management by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/322
* refactor fhir calls to use POST by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/298
* DB Creation fix by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/331
* drawer style tweaks by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/342
* valueset search part one by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/341
* ALB update by @shanice-skylight in https://github.com/CDCgov/dibbs-query-connector/pull/330
* valueset search part two by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/339
* Initializing users, function to update qc_role by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/340
* Add Keycloak to ECS by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/321
* SPIKE - code coverage by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/349
* Remove JAVA_OPTS_APPEND from docker compose by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/351
* change redirect "homepage" click when logged in by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/359
* Kcd/user management super admin view by @johanna-skylight in https://github.com/CDCgov/dibbs-query-connector/pull/343
* [pre-commit.ci] pre-commit autoupdate by @pre-commit-ci[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/364
* Add loading bar at top of page; add Page component to root layout by @katyasoup in https://github.com/CDCgov/dibbs-query-connector/pull/365
* query building tweaks by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/370
* clean up outdated npm packages by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/373
* turn off next auth debug mode by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/377
* Updating user management flyway migrations by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/367
* Added terraform workflow dependency on CD and keycloak by @shanice-skylight in https://github.com/CDCgov/dibbs-query-connector/pull/366
* jd/integrate user management with data by @johanna-skylight in https://github.com/CDCgov/dibbs-query-connector/pull/368
* [pre-commit.ci] pre-commit autoupdate by @pre-commit-ci[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/379
* Fix terraform deployment by @shanice-skylight in https://github.com/CDCgov/dibbs-query-connector/pull/378
* Initialize UserGroup insert/update/delete work by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/382
* seed api documentation  by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/383
* Super admin testing by @johanna-skylight in https://github.com/CDCgov/dibbs-query-connector/pull/381
* bump testing library package versions by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/394
* [pre-commit.ci] pre-commit autoupdate by @pre-commit-ci[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/390
* add loading skeletons to query execution flow by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/395
* Initialize backend add/delete for usergroup_to_users by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/389
* Initializing Query drawer backend for User group work by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/400
* Add Aidbox by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/384
* change the clone addy in README.md by @akintner in https://github.com/CDCgov/dibbs-query-connector/pull/403
* Upgrade to node 22 by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/401
* Aidbox local hotfix by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/408
* Create an Admin view for UserGroups by @katyasoup in https://github.com/CDCgov/dibbs-query-connector/pull/391
* Add aidbox seed script and container to docker-compose-dev.yaml by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/409
* JD/restrict page access by role by @johanna-skylight in https://github.com/CDCgov/dibbs-query-connector/pull/402
* fix golden patient data by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/413
* Architecture for VM and ECS by @shanice-skylight in https://github.com/CDCgov/dibbs-query-connector/pull/404
* [pre-commit.ci] pre-commit autoupdate by @pre-commit-ci[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/415
* refactor fhir servers db methods into service class by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/405
* Setup session refresh in session provider by @johanna-skylight in https://github.com/CDCgov/dibbs-query-connector/pull/429
* refactor e2e infra by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/430
* fix for QUE-136 fix edit queries by @akintner in https://github.com/CDCgov/dibbs-query-connector/pull/428
* fix local e2e setup by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/439
* add extra note for local e2e by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/442
* Add JWKS generation to both dev and prod Docker setups by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/433
* Audit Log Frontend Page by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/414
* jd/implements automatic logout modal by @johanna-skylight in https://github.com/CDCgov/dibbs-query-connector/pull/440
* Setup of test accounts for admin and standard roles in local and dev env by @johanna-skylight in https://github.com/CDCgov/dibbs-query-connector/pull/443
* drawer style tweaks by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/444
* SMART on FHIR pt 1 - infra / db  by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/455
* SMART on FHIR pt 2 - backend changes by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/452
* jd/implement handling expired tokens by @johanna-skylight in https://github.com/CDCgov/dibbs-query-connector/pull/453
* Jd/eslint ignore jest mocks by @johanna-skylight in https://github.com/CDCgov/dibbs-query-connector/pull/466
* [pre-commit.ci] pre-commit autoupdate by @pre-commit-ci[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/461
* Toggle User and Query assignment from Drawer/Modal by @katyasoup in https://github.com/CDCgov/dibbs-query-connector/pull/445
* SMART on FHIR pt 3 - frontend changes by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/458
* Audit Log Date Range Picker update by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/451
* refactor tests by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/480
* Adding blue chips on custom query condition selection by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/482
* Edit/Delete buttons for User groups and Users details by @katyasoup in https://github.com/CDCgov/dibbs-query-connector/pull/471
* Adding help text to category and condition data by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/488
* refactor query execution by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/481
* Moving from edge Aidboxone to stable Aidboxone by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/489
* add auditable decorators by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/490
* Update jwkset name by @katyasoup in https://github.com/CDCgov/dibbs-query-connector/pull/492
* Move 'Run Query' from dropdown menu to header button by @katyasoup in https://github.com/CDCgov/dibbs-query-connector/pull/486
* Alphabetize queries in the Query Library by @katyasoup in https://github.com/CDCgov/dibbs-query-connector/pull/487
* [pre-commit.ci] pre-commit autoupdate by @pre-commit-ci[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/494
* Adding audit log hash update by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/493
* Adding audit log delete/update protections by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/497
* Streamline modal styles by @katyasoup in https://github.com/CDCgov/dibbs-query-connector/pull/507
* connect audit log backend to frontend page by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/496
* Fix "disable_cert_validation" by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/512
* Updating Run a query button text by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/519
* Fix how includeImmunizations is read in patientRecordsQuery by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/523
* Keeping users on Custom Query page after Save query is clicked by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/520
* Add search filtering to User management drawers by @katyasoup in https://github.com/CDCgov/dibbs-query-connector/pull/509
* Initializing Audit Log Drawer by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/513
* modularize e2e env var seeding by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/525
* Redirect to /query if logged in by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/524
* Extending Audit Log search to audit message by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/528
* Query filtering by user group by @akintner in https://github.com/CDCgov/dibbs-query-connector/pull/483
* refactor fhirServers service to use camel case decorator by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/531
* Moving sign in button on home page by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/521
* Add version numbers to query connector packages by @shanice-skylight in https://github.com/CDCgov/dibbs-query-connector/pull/530
* Quick fix Package release by @shanice-skylight in https://github.com/CDCgov/dibbs-query-connector/pull/541
* Add sidebar item and empty state for "Add codes from library" customization by @katyasoup in https://github.com/CDCgov/dibbs-query-connector/pull/533
* refactor user management into service class pattern by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/545
* [pre-commit.ci] pre-commit autoupdate by @pre-commit-ci[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/532
* Move contents of 'query-connector' into root directory by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/560
* Followup - fix context in cd workflows by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/561
* Refactor database-service into class by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/529
* delete customize query by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/550
* Adding userCreated migration for valuesets by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/571
* Change aidbox client name to query-connector by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/562
* refactor query execution and building by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/565
* refactor user group management code into service class pattern by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/572
* refactor fhir server setup interface by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/575
* Initializing custom code backend by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/574
* [pre-commit.ci] pre-commit autoupdate by @pre-commit-ci[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/581
* Add ability to specify default FHIR server by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/576
* mark user management functions as auditable by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/577
* Add Code Library page by @katyasoup in https://github.com/CDCgov/dibbs-query-connector/pull/573
* Add Custom Code upsert to existing query data by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/583
* add new audit log tests by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/584
* Updating /queryBuilding page to support Custom ValueSets by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/594
* Switch image tag pulled by Terraform to "latest" by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/597
* Reloading page when same page clicked in gear dropdown by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/598
* Add Value Set page by @katyasoup in https://github.com/CDCgov/dibbs-query-connector/pull/588
* reorganize backend db services files by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/589
* mark query building actions as auditable by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/590
* Add support for Microsoft Entra ID by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/596
* Auth env var changes for Terraform by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/602
* Adding ValueSet level toasts to Custom query workflow by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/600
* Adding save query to condition selection step of Query Building and assign authorship by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/601
* One more auth env var change by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/603
* add redirects to query library from selection step by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/599
* Add ability to delete custom codes and value sets by @katyasoup in https://github.com/CDCgov/dibbs-query-connector/pull/604
* Changing click row on queryBuilding valueset customization by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/579
* Tracking selectedQuery with Data Context by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/605
* Add deployment guide by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/611
* add audit log compliance writeup by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/613
* Form validation: check required fields before saving a custom value set by @katyasoup in https://github.com/CDCgov/dibbs-query-connector/pull/610
* design system updates by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/609
* fix minus state by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/619
* [pre-commit.ci] pre-commit autoupdate by @pre-commit-ci[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/614
* Various UI bug fixes by @katyasoup in https://github.com/CDCgov/dibbs-query-connector/pull/616
* Adding warning modal for unsaved query building changes by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/615
* String custom codes pages together by @katyasoup in https://github.com/CDCgov/dibbs-query-connector/pull/620
* Initializing Select mode for Code Library page by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/617
* feat: add workflow to trigger deploy to demo by @alismx in https://github.com/CDCgov/dibbs-query-connector/pull/624
* configure role information seeding from IdP by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/625
* Rename Query Library to Query Repository by @katyasoup in https://github.com/CDCgov/dibbs-query-connector/pull/627
* Fix query deletion by @katyasoup in https://github.com/CDCgov/dibbs-query-connector/pull/629
* update truss package by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/633
* add user refresh on sign in by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/632
* Add Markdown docs to the site at /docs by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/623
* Change AUTH_KEYCLOAK_ISSUER back to AUTH_ISSUER by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/635
* remove social determinants from queries by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/638
* fix audit log null pointer by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/640
* Add Drawer to ResultsView by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/631
* revert dev Keycloak by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/645
* Update Next and React by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/636
* Prefill patient search from URL params by @katyasoup in https://github.com/CDCgov/dibbs-query-connector/pull/647
* Require info minimum for patient search by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/644
* Add API Authentication by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/666
* add address data to patient query by @katyasoup in https://github.com/CDCgov/dibbs-query-connector/pull/667
* Add email support for frontend and API calls by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/650
* Clear error message when closing FHIR server config modal by @katyasoup in https://github.com/CDCgov/dibbs-query-connector/pull/669
* Fix auth provider env var by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/675
* Properly set issuer including realm instead of adding manually by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/676
* add table overflow styling by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/639
* [pre-commit.ci] pre-commit autoupdate by @pre-commit-ci[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/672
* Setting up FHIR Servers save last connection by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/668
* Update endpoint for testing fhir server connections by @katyasoup in https://github.com/CDCgov/dibbs-query-connector/pull/671
* Improve API Docs and add more Keycloak seed data by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/682
* Upgrade RDS engine version to 16.8 in dev by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/689
* add linting config for sass and json by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/688
* Don't clear query on backnav by @katyasoup in https://github.com/CDCgov/dibbs-query-connector/pull/683
* Fixing Code Library button hover state by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/690
* sync design system implementation by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/691
* lighthouse audit fixes by @katyasoup in https://github.com/CDCgov/dibbs-query-connector/pull/687
* Add Medical Records Section to queryBuilding by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/681
* add toast styles back in by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/695
* [pre-commit.ci] pre-commit autoupdate by @pre-commit-ci[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/699
* Fixing remaining warnings in npm run build by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/697
* Add ability to configure FHIR server headers in frontend by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/702
* Expanding date range picker to support timeboxing by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/701
* Add keyboard-friendly bulk action buttons to accordions by @katyasoup in https://github.com/CDCgov/dibbs-query-connector/pull/705
* change a error to a warning by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/704
* Adjust styling for query building accordions by @katyasoup in https://github.com/CDCgov/dibbs-query-connector/pull/706
* make query repository hover buttons tabbable by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/708
* add axe for accessibility testing by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/696
* Updated Load balancer certificate by @shanice-skylight in https://github.com/CDCgov/dibbs-query-connector/pull/709
* Removing Custom Condition from the Custom Query Condition Selection by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/713
* Add auth_type to Aidbox insert by @katyasoup in https://github.com/CDCgov/dibbs-query-connector/pull/679
* Updating category data to build eRSD backend by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/716
* add drawer focus trap by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/719
* update eslint by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/710
* fix tab accessibility issues on query building by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/714
* Tab audit - custom codes by @katyasoup in https://github.com/CDCgov/dibbs-query-connector/pull/715
* Adding frontend support for $match by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/722
* Fix /metadata endpoint check by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/725
* update documentation to include idp role configuration by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/727
* Tab audit - User Management by @katyasoup in https://github.com/CDCgov/dibbs-query-connector/pull/726
* Update tab flow on user management tables by @katyasoup in https://github.com/CDCgov/dibbs-query-connector/pull/729
* split apart value set selection by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/730
* Make header & footer mobile-responsive by @katyasoup in https://github.com/CDCgov/dibbs-query-connector/pull/737
* chore: add Dependabot configuration for npm, docker and terraform wee… by @alismx in https://github.com/CDCgov/dibbs-query-connector/pull/738
* implement time boxing designs by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/748
* timebox backend implementation by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/755
* fix query filtering by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/757
* Use $match in Patient Discovery if enabled by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/736
* How to deploy Query Connector to App Service by @shanice-skylight in https://github.com/CDCgov/dibbs-query-connector/pull/756
* Updating  testing for $match by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/764
* extend FHIR queries to do date filtering by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/776
* reorg orphan files in `/shared` to correct folders by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/789
* make time filtering relative by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/793
* [pre-commit.ci] pre-commit autoupdate by @pre-commit-ci[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/783
* Fixing apiDocs endpoint by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/774
* Mutual TLS / Task-based Queries by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/753
* make time filtering frontend relative strings by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/794
* Added instructions for configuring uuid-ossp via ClickOps by @shanice-skylight in https://github.com/CDCgov/dibbs-query-connector/pull/806
* Adding custom value set form CSV upload option by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/792
* Add some improvements to the valuset ingestion flow by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/809
* fix seeding script by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/821
* Updating categories for latest eRSD Update by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/826
* make mutual tls an auth option by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/825
* Trying fix to custom headers e2e test by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/829
* fix headers custom headers test flakage by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/830
* Add CA Certificate field to FHIR servers by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/831
* Simplifying flyway migrations by @robertandremitchell in https://github.com/CDCgov/dibbs-query-connector/pull/822
* fix local build errors by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/832
* Deploy mTLS environment variables by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/837
* add in support for service requests by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/838
* make seeding transactional by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/849
* fix transactions by @fzhao99 in https://github.com/CDCgov/dibbs-query-connector/pull/855
* Fix query creation bug by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/861
* Remove "Query ID not set" toast by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/862
* Add APP_HOSTNAME to dev environment to fix JWKS creation by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/863
* Upgrade Next.js CVE-2025-55182 by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/874
* Upgrade Next again by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/875
* Set version to 1.0.0 by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/878
* Audit updates by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/879
* Add demo creds to connector.dibbs.tools by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/880
* Fix demo creds display by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/881
* Add server-side pagination to Code Library by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/883
* Allow database password rotation via Secrets Manager by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/886
* Add fixes for trivy findings by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/887
* Consolidate 18 dependabot PRs into single dependency update by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/889
* Add RDS SSL support by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/896
* Fix database seeding failures caused by VSAC version drift and error handling by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/897
* Support database password rotation properly by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/898
* Add PingFederate support by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/899
* Consolidate 3 dependabot PRs into single dependency update by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/906
* Fix documentation links on GitHub while preserving site functionality by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/888
* Security fixes for AWS Inspector findings by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/910
* fix(security): pin trivy-action to SHA to mitigate supply chain attack by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/911
* Add category skips for eRSD drift by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/924
* Fix database seeding for eRSD v3 compatibility by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/925
* chore(deps): consolidate 8 dependabot PRs into single dependency update by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/923
* Run npm audit fix by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/928
* Add Azure Database for PostgreSQL SSL support by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/933
* Update README.md by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/936
* fix(ci): make aidbox-seeder reliable and surface failures by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/938
* chore(deps): remove unused packages and defer Node major bumps by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/937
* Convert FHIR Connection Guide to MDX with extracted images by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/945
* chore(deps): remove unused @types/uuid and defer jose/bundle-analyzer majors by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/946
* Query MedicationStatement and show it in a Medications section by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/951
* Update development.mdx by @mattmgoldberg in https://github.com/CDCgov/dibbs-query-connector/pull/953
* Add Endpoint Type to FHIR servers (Standard / Immunization Gateway / Fanout) by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/955
* Preserve patient search inputs when revising a search by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/958
* chore(deps): batch Dependabot updates (fhirpath, undici, testcontainers 12, @types/fhir, form-data, qs, tmp, testing-library) by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/960
* fix(terraform): pin RDS engine_version to major version only by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/961
* Show raw FHIR requests alongside the response in the results drawer by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/959
* Document the FHIR resources queried by Query Connector by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/954
* docs: add cloud-agnostic deployment reference diagram by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/964
* fix(seeding): make VSAC condition lookups resilient to transient network failures by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/962
* Fix Immunization patient scoping (IZ Gateway) and isolate per-resource query failures (UMC) by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/965
* Add proper release workflow with git tagging and GitHub Releases by @nickclyde in https://github.com/CDCgov/dibbs-query-connector/pull/963
### 👒 Dependencies
* Bump next from 14.2.4 to 14.2.10 in /containers/tefca-viewer by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/1
* Bump next from 14.2.4 to 14.2.10 in /containers/tefca-viewer by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/19
* Bump cross-spawn from 7.0.3 to 7.0.6 in /query-connector by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/173
* Bump nanoid from 3.3.7 to 3.3.8 in /query-connector by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/221
* Bump next from 14.2.10 to 14.2.15 in /query-connector by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/225
* Bump next from 14.2.15 to 14.2.22 in /query-connector by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/244
* Bump undici from 5.28.4 to 5.28.5 in /query-connector by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/305
* Bump next from 14.2.22 to 14.2.26 in /query-connector by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/465
* Bump tar-fs and testcontainers in /query-connector by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/477
* Bump formidable from 3.5.2 to 3.5.4 by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/569
* Bump undici from 5.28.5 to 5.29.0 by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/607
* Bump tar-fs by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/673
* Bump next from 15.3.2 to 15.3.4 by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/723
* Bump keycloak/keycloak from 26.1 to 26.3 by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/740
* Bump html-react-parser from 5.2.2 to 5.2.5 by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/742
* Bump form-data from 4.0.2 to 4.0.4 by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/749
* Bump @next/bundle-analyzer from 15.3.5 to 15.4.4 by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/758
* Bump node from 22-alpine to 24-alpine by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/741
* Bump testcontainers from 10.23.0 to 11.4.0 by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/759
* Bump jest from 30.0.3 to 30.0.5 by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/760
* Bump dotenv from 16.4.7 to 17.2.1 by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/761
* Bump next-auth from 5.0.0-beta.25 to 5.0.0-beta.29 by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/766
* Bump autoprefixer from 10.4.20 to 10.4.21 by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/769
* Bump pg-promise from 11.10.2 to 11.15.0 by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/767
* Bump pg and @types/pg by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/768
* Bump eslint-plugin-jsdoc from 51.4.1 to 54.1.1 by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/811
* Bump undici from 7.14.0 to 7.15.0 by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/815
* Bump @playwright/test from 1.54.2 to 1.55.0 by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/814
* Bump eslint-config-next from 15.4.7 to 15.5.2 by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/818
* Bump @types/react-dom from 19.1.5 to 19.1.9 by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/819
* Bump next from 15.5.15 to 15.5.18 by @dependabot[bot] in https://github.com/CDCgov/dibbs-query-connector/pull/935

### New Contributors
* @DanPaseltiner made their first contribution in https://github.com/CDCgov/dibbs-query-connector/pull/3
* @m-goggins made their first contribution in https://github.com/CDCgov/dibbs-query-connector/pull/5
* @pre-commit-ci[bot] made their first contribution in https://github.com/CDCgov/dibbs-query-connector/pull/13
* @dependabot[bot] made their first contribution in https://github.com/CDCgov/dibbs-query-connector/pull/1
* @bamader made their first contribution in https://github.com/CDCgov/dibbs-query-connector/pull/31
* @shanice-skylight made their first contribution in https://github.com/CDCgov/dibbs-query-connector/pull/109
* @mikang made their first contribution in https://github.com/CDCgov/dibbs-query-connector/pull/268
* @dibbs-anon made their first contribution in https://github.com/CDCgov/dibbs-query-connector/pull/336
* @johanna-skylight made their first contribution in https://github.com/CDCgov/dibbs-query-connector/pull/337
* @akintner made their first contribution in https://github.com/CDCgov/dibbs-query-connector/pull/403
* @alismx made their first contribution in https://github.com/CDCgov/dibbs-query-connector/pull/624
* @mattmgoldberg made their first contribution in https://github.com/CDCgov/dibbs-query-connector/pull/953
