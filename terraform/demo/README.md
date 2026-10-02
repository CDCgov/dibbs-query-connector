# Query Connector demo deployment (Azure Container Apps)

This directory defines the single deployed instance of Query Connector,
https://connector.dibbs.tools. It is applied automatically by the `CD` GitHub
Actions workflow on every merge to `main`, deploying the image digest that the
same workflow just built and pushed to GHCR.

## Layout

| Path | Applied by | Purpose |
| --- | --- | --- |
| `terraform/bootstrap` | A subscription Owner, once, locally | Resource group `dibbs-qc`, the `dibbs-qc-github` managed identity GitHub assumes through OIDC, and its role assignments |
| `terraform/demo` | `CD` workflow (and locally for debugging) | VNet peered to the dibbs.tools hub, Container Apps environment, the `query-connector` and `aidbox` container apps, and the `aidbox-seeder` job |

Shared platform resources are **not** managed here. They live in
[skylight-hq/dibbs-tf-envs](https://github.com/skylight-hq/dibbs-tf-envs):

- `global/`: the `dibbs-global-postgres` flexible server and its databases
  (`query_connector_demo`, `qc_aidbox`), the `skylightdibbsglobalkv` and
  `skylightdibbsdemokv` Key Vaults, and the Terraform state storage account.
- `demo/global`: the `dibbs.tools` DNS zone, the hub VNet and the hub
  Application Gateway that terminates TLS for `connector.dibbs.tools` and
  forwards to this stack's `query-connector` container app by its private FQDN.

The contract between the two is small: this stack outputs
`query_connector_fqdn`, and the hub gateway's backend pool, HTTP settings and
health probe (`/api`) use that FQDN. The private DNS zone for the Container
Apps environment is linked to the hub VNet from this stack, so the gateway can
resolve it.

## Secrets

All runtime configuration comes from Key Vault; GitHub holds no application
secrets. Terraform reads these as data sources and injects them as Container
Apps secrets.

`skylightdibbsglobalkv`:
`query-connector-demo-db-user`, `query-connector-demo-db-password`,
`query-connector-demo-azuread-tenant-id`, `query-connector-demo-client-id`,
`query-connector-demo-client-secret`

`skylightdibbsdemokv`:
`query-connector-umls-api-key`, `query-connector-ersd-api-key`,
`query-connector-auth-secret`, `query-connector-aidbox-license`,
`query-connector-aidbox-client-secret`, `query-connector-aidbox-admin-password`,
`query-connector-aidbox-db-user`, `query-connector-aidbox-db-password`

GitHub repository **variables** (not secrets) used by the workflows:
`AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`. Their values are
the outputs of `terraform/bootstrap`.

## Bootstrapping from nothing

```bash
az login
az account set --subscription "CDC - DIBBs"
# The az CLI may have a default resource group configured; clear it so
# commands below do not silently target the wrong group.
az configure --defaults group=

cd terraform/bootstrap
terraform init
terraform apply
terraform output
```

Then:

1. Create the GitHub environment `demo` and set the three repository
   variables from the outputs.
2. Write the Key Vault secrets listed above (`az keyvault secret set
   --vault-name skylightdibbsdemokv --name ... --value ...`).
3. In `dibbs-tf-envs`, make sure `global/postgres.tf` defines the
   `query_connector_demo` and `qc_aidbox` databases and that the Aidbox role
   exists on the server. The server only allows Azure-internal traffic plus
   explicit firewall rules, so add your IP first
   (`az postgres flexible-server firewall-rule create --resource-group skylight-dibbs-global
   --server-name dibbs-global-postgres --name <your-name> --start-ip-address <ip>
   --end-ip-address <ip>`), then connect as the server admin (credentials are
   `dibbs-global-postgres-admin-user` / `-password` in `skylightdibbsglobalkv`):

   ```sql
   CREATE ROLE qc_aidbox LOGIN PASSWORD '<query-connector-aidbox-db-password>';
   GRANT qc_aidbox TO <server admin login>;
   ALTER DATABASE qc_aidbox OWNER TO qc_aidbox;
   -- Aidbox creates its extensions at startup. If it fails with a permission
   -- error on CREATE EXTENSION, also run: GRANT azure_pg_admin TO qc_aidbox;
   ```

4. Merge to `main` (or run `CD` manually). The first apply creates the
   Container Apps environment, which takes about ten minutes.
5. Apply `demo/global` in `dibbs-tf-envs` so the hub gateway picks up the
   `query-connector` container app FQDN.
6. Seed Aidbox once: `az containerapp job start -g dibbs-qc -n aidbox-seeder`.
   Then sign in and open `/queryBuilding` to seed conditions and value sets.

## Day-to-day

- **Deploy main**: merge to `main`.
- **Deploy a specific version**: Actions, `CD`, Run workflow, set `version`
  to a GHCR tag such as `v1.2.3`.
- **Logs**: Log Analytics workspace `dibbs-qc-logs`, or
  `az containerapp logs show -g dibbs-qc -n query-connector --follow`.
- **Plan locally** (read-only, needs `az login`):

  ```bash
  cd terraform/demo
  terraform init
  terraform plan \
    -var image="$(terraform output -raw image)" \
    -var seeder_image="$(terraform output -raw seeder_image)"
  ```

- **Reset Aidbox data**: rerun the `aidbox-seeder` job. It is idempotent for
  the SMART client, access policy and `fhir_servers` row; patient resources
  are re-posted.

## Notes

- The Container Apps environment uses the Consumption workload profile and an
  internal load balancer. Nothing in this stack is reachable from the
  internet except through the hub Application Gateway.
- Images are pulled anonymously from GHCR (the packages are public), so there
  is no container registry in this stack.
- The shared Postgres server and the hub gateways are stopped overnight on
  weekdays by cost-optimization workflows in `dibbs-tf-envs`, so the demo is
  intentionally unavailable roughly 01:00 to 10:00 UTC Monday through Friday.
