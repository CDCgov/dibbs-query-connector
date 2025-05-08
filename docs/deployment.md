## Deploying Query Connector

Full guide coming soon...

### Identity Provider

Query Connector currently supports the following identity providers:

- [Keycloak](https://www.keycloak.org/)
- [Microsoft Entra ID (formerly Active Directory)](https://www.microsoft.com/en-us/security/business/identity-access/microsoft-entra-id)
- [(Coming soon) PingFederate](https://www.pingidentity.com/en/solutions/pingfederate.html)

In order to select your identity provider, you must set the `NEXT_PUBLIC_AUTH_PROVIDER` environment variable in your `.env` file to the name of the provider you want to use. For example, if you want to use Keycloak, set `NEXT_PUBLIC_AUTH_PROVIDER=keycloak`. If you want to use Microsoft Entra ID, set `NEXT_PUBLIC_AUTH_PROVIDER=microsoft-entra-id`. You will also need to set the associated environment variables found in `.env.sample` for your identity provider. See the [Environment Variables](#environment-variables) section below for more information.

### Environment Variables

The following environment variables are required to run Query Connector. You can set them in a `.env` file in the root of your project. You can also set them in your deployment environment if you prefer. The `.env.sample` file contains a list of all the environment variables you need to set. You can copy this file to `.env` and fill in the values as needed.

<!-- TODO: Fill this out -->

```bash
# .env
# Required environment variables
NEXT_PUBLIC_AUTH_PROVIDER=keycloak # or microsoft-entra-id
```

