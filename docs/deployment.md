# Deploying Query Connector

Query Connector has a simple architecture with just a few pieces:

1. The app itself, a [Next.js](https://nextjs.org/) application bundled as a [Docker](https://www.docker.com/) container

2. A [PostgreSQL](https://www.postgresql.org/) database which stores some basic information and configuration for the app (support for other database engines can be developed on request)

3. An [Identity Provider](https://en.wikipedia.org/wiki/Identity_provider) which provides user authentication for the app

4. A [FHIR server](https://www.hl7.org/fhir/overview.html) which will respond to queries

As the person or team deploying Query Connector, you are only responsible for deploying and managing the app, database, and potentially an identity provider, unless your organization already has one. Your data provider will provide the FHIR server, which will likely need to be register your Query Connector instance as a client.

## Query Connector App

There are two main ways of deploying the app:

1. As a Docker container, which lives in GitHub Container Registry [here](https://github.com/CDCgov/dibbs-query-connector/pkgs/container/dibbs-query-connector%2Fquery-connector).

2. As a virtual machine, with a [VM image](https://github.com/CDCgov/dibbs-vm) you can deploy on your hypervisor of choice.

### Docker deployment



### VM deployment



## Database

Currently, Query Connector requires a PostgreSQL database to store information on things like conditions and value sets, as well as configuration for user management and audit logs. For test/UAT/QA environments, it may be more convenient to run this database alongside the app in the same virtual machine, and our provided VM image supports this. However, for production environments, we strongly recommend using a managed database service.

## Identity Provider

Query Connector currently supports the following identity providers:

- [Keycloak](https://www.keycloak.org/)
- [Microsoft Entra ID (formerly Active Directory)](https://www.microsoft.com/en-us/security/business/identity-access/microsoft-entra-id)
- [(Coming soon) PingFederate](https://www.pingidentity.com/en/solutions/pingfederate.html)

In order to select your identity provider, you must set the `NEXT_PUBLIC_AUTH_PROVIDER` environment variable in your `.env` file to the name of the provider you want to use. For example, if you want to use Keycloak, set `NEXT_PUBLIC_AUTH_PROVIDER=keycloak`. If you want to use Microsoft Entra ID, set `NEXT_PUBLIC_AUTH_PROVIDER=microsoft-entra-id`. You will also need to set the associated environment variables found in `.env.sample` for your identity provider. See the [Environment Variables](#environment-variables) section below for more information.

## FHIR Server



## Other considerations

### Environment Variables

The following environment variables are required to run Query Connector. You can set them in a `.env` file in the root of your project. You can also set them in your deployment environment if you prefer. The `.env.sample` file contains a list of all the environment variables you need to set. You can copy this file to `.env` and fill in the values as needed.

<!-- TODO: Fill this out -->

```bash
# .env
# Required environment variables
NEXT_PUBLIC_AUTH_PROVIDER=keycloak # or microsoft-entra-id
AUTH_CLIENT_ID=your-client-id
AUTH_CLIENT_SECRET=your-client-secret
AUTH_ISSUER=idp-issuer-url
```
