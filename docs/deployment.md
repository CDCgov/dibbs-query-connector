# Deploying Query Connector

Query Connector has a simple architecture with just a few pieces:

1. The app itself, a [Next.js](https://nextjs.org/) application bundled as a [Docker](https://www.docker.com/) container

2. A [PostgreSQL](https://www.postgresql.org/) database that stores some basic information and configuration for the app (support for other database engines can be developed on request)

3. An [Identity Provider](https://en.wikipedia.org/wiki/Identity_provider) that provides user authentication for the app

4. A [FHIR server](https://www.hl7.org/fhir/overview.html) that will respond to queries

As the person or team deploying Query Connector, you're only responsible for deploying and managing the app, database, and potentially an identity provider, unless your organization already has one. Your data provider will provide the FHIR server, which will likely need to register your Query Connector instance as a client.

## Query Connector app

There are two main ways to deploy the app:

1. As a Docker container, which lives in GitHub Container Registry [here](https://github.com/CDCgov/dibbs-query-connector/pkgs/container/dibbs-query-connector%2Fquery-connector)

2. As a virtual machine, with a [VM image](https://github.com/CDCgov/dibbs-vm) you can deploy on your hypervisor of choice

### Docker deployment

There are a number of different ways you can deploy a Docker container:

- Spin up a virtual machine (e.g., an [EC2 instance](https://aws.amazon.com/ec2/) or [Azure virtual machine](https://azure.microsoft.com/en-us/products/virtual-machines)) with Docker installed, pull the image, and run it.

- Use a container orchestration service like AWS [Elastic Container Service](https://aws.amazon.com/ecs/) (ECS) or Azure [Container Apps](https://azure.microsoft.com/en-us/products/container-apps).

- Use a Platform-as-a-Service (PaaS) like AWS [Elastic Beanstalk](https://aws.amazon.com/elasticbeanstalk/), Azure [App Service](https://azure.microsoft.com/en-us/products/app-service), [Heroku](https://www.heroku.com/), or [Vercel](https://vercel.com/).

- Use a managed Kubernetes service like AWS [EKS](https://aws.amazon.com/eks/) or Azure [AKS](https://azure.microsoft.com/en-us/products/kubernetes-service).

Here we provide a basic example of pulling the Docker image onto an EC2 instance, but we're happy to provide guidance on the other options, as well. 

To deploy Query Connector using Docker on an EC2 instance or other virtual machine with Docker installed:

1. **Pull the container image**:
   
   ```bash
   docker pull ghcr.io/cdcgov/dibbs-query-connector/query-connector:latest
   ```
   
   Alternatively, you can use a specific version:
   
   ```bash
   docker pull ghcr.io/cdcgov/dibbs-query-connector/query-connector:1.0.1
   ```

2. **Create an environment file**:
   Create a `.env` file with all required environment variables (see the [Environment Variables section](#environment-variables) below).

3. **Run the container**:
   
   ```bash
   docker run -d \
     --name query-connector \
     -p 3000:3000 \
     --env-file .env \
     ghcr.io/cdcgov/dibbs-query-connector/query-connector:latest
   ```

**For production environments**:

- Use a container orchestration platform like ECS or a PaaS like Azure App Service to get benefits like autoscaling and easier updates.
- Remember to set up proper networking, load balancing, and SSL termination.
- Implement monitoring and logging solutions.
- Consider using a managed database service for PostgreSQL.

### VM deployment

For organizations with restrictions on container usage or specific compliance requirements, VM deployment is available:

1. Download the provided VM image from [the dibbs-vm repository](https://github.com/CDCgov/dibbs-vm).

2. Import to your hypervisor:
   
   - For VMware: Import the OVA file through vSphere client or VMware Workstation
   - For Hyper-V: Import the VHDX file
   - For VirtualBox: Import the OVA file
   - For cloud providers: Convert to the appropriate format (AMI for AWS, VHD for Azure, etc.)

3. Configure VM resources:
   
   - For production: 4+ vCPUs, 8+ GB RAM, 50+ GB storage
   - For testing: 2+ vCPUs, 4+ GB RAM, 20+ GB storage

4. Begin by initiating the bash setup script, which is called [dibbs-query-connector-wizard.sh](http://dibbs-query-connector-wizard.sh).

5. Once you initiate the script, you’ll see a warning message pop up. This warning lets you know that, if you don’t have a database you’re connecting to Query Connector, there’s a development database you can deploy instead. 

6. By default, the script will deploy an application called dibbs-query-connector tagged to the latest stable version available within the VM. Unless you want to change either of these defaults, accept both prompts by pressing Enter.

7. Next, you’ll see a mention of the node environment, NODE_ENV {production} – by default, we assume that you’re deploying to a production environment. If needed, update this name to describe the environment you’re deploying to (e.g., test, development, etc.).

8. Next, you’ll be asked about the database you’d like to connect to: Do you have a pre-existing database available to connect to Query Connector? You can choose either yes or no – the default response is yes. Our intention is for our users to have their own managed database for any production instance of the VM. If you have a managed database, choose yes.

9. If you don’t have a managed database, choose no. You’ll see another variable, DB, at the bottom of your Terminal. This creates a dev DB container.

10. At this point, you’ll be asked for your database connection string – enter it now.

11. You’ll next be asked to disable or enable authentication (we recommend enabling it). To enable authentication, choose true. To disable it, choose false.

12. If you have a self-signed certificate, you can utilize it here.

13. Next, you’ll be prompted to enter secrets and API keys:
    
    - The first one is an auth secret key. 
    
    - The next is your authentication endpoint.
    
    - Next, enter your ERSD API key. Our README files [link] have instructions for obtaining these keys – there’s no default key, because each user should use their own.
    
    - Finally, enter your UMLS API key.

14. With these variables set, the following containers will be started:
    
    - The Query Connector app container
    
    - Portainer (the solution we provide for users to manage their containers out of the box)
    
    - Docs (central location for the README file and other documentation you might need)

15. Navigate to Portainer and then visit the Dashboard. Here, you can view containers, images, stack, networks, and volumes.

16. Navigate to the DIBBs container and you can see the container logs. Note: If you don’t have a database deployed, you’ll see a database error message.

Congrats, the app should now be up and running!

## Database

Currently, Query Connector requires a PostgreSQL database to store information on things like conditions and value sets, as well as to configure user management and audit logs. For test/UAT/QA environments, it may be more convenient to run this database alongside the app in the same virtual machine, and our provided VM image supports this. However, for production environments, we strongly recommend using a managed database service.

### Setting up a production database

1. **Create a managed PostgreSQL instance**:
   
   - AWS: [RDS for PostgreSQL](https://aws.amazon.com/rds/postgresql/)
   - Azure: [Azure Database for PostgreSQL](https://azure.microsoft.com/en-us/products/postgresql)
   - GCP: [Cloud SQL for PostgreSQL](https://cloud.google.com/sql/docs/postgres)
   - Self-hosted: Use a high-availability PostgreSQL setup

2. **Database requirements**:
   
   - PostgreSQL version 13 or higher
   - At least 10GB of storage to start
   - Configure automated backups
   - Set up monitoring for database performance

3. **Database migrations**:
   Query Connector uses Flyway for database migrations. The app will automatically apply migrations when it starts up.
   
   Ensure your `flyway.conf` file points to your production database.

4. **Database connection**:
   Update the `DATABASE_URL` environment variable in your Query Connector configuration to point to your production database.

## Identity provider

Query Connector currently supports the following identity providers:

- [Keycloak](https://www.keycloak.org/)
- [Microsoft Entra ID (formerly Active Directory)](https://www.microsoft.com/en-us/security/business/identity-access/microsoft-entra-id)
- [(Coming soon) PingFederate](https://www.pingidentity.com/en/solutions/pingfederate.html)

### Keycloak configuration

If using Keycloak:

1. **Create a new realm** for Query Connector or use an existing one.

2. **Create a new client**:
   
   - Client ID: `query-connector` (or your preferred name)
   - Client Protocol: `openid-connect`
   - Access Type: `confidential`
   - Valid Redirect URIs: `https://your-query-connector-url/api/auth/callback/keycloak`
   - Web Origins: `https://your-query-connector-url`
   - Enable "Client authentication" and check "Standard" for "Authentication flow"

3. **Get client credentials**:
   
   - Go to the Credentials tab for your client.
   - Copy the Secret value for use in your environment variables.

4. **Configure environment variables**:
   
   ```
   NEXT_PUBLIC_AUTH_PROVIDER=keycloak
   AUTH_CLIENT_ID=query-connector
   AUTH_CLIENT_SECRET=your-secret-from-keycloak
   AUTH_ISSUER=https://your-keycloak-url/realms/your-realm
   ```

### Microsoft Entra ID configuration

If using Microsoft Entra ID:

1. **Register a new application**:
   
   - Go to Azure Portal > Microsoft Entra ID > App registrations.
   - Create a new registration.
   - Set the redirect URI to: `https://your-query-connector-url/api/auth/callback/microsoft-entra`.

2. **Configure API permissions**:
   
   - Add Microsoft Graph permissions (email, openid, and profile).

3. **Create client secret**:
   
   - Go to Certificates & Secrets.
   - Create a new client secret and note the value.

4. **Configure environment variables**:
   
   ```
   NEXT_PUBLIC_AUTH_PROVIDER=microsoft-entra-id
   AUTH_CLIENT_ID=your-application-id
   AUTH_CLIENT_SECRET=your-client-secret
   AUTH_ISSUER=https://login.microsoftonline.com/your-tenant-id/v2.0
   ```

## FHIR server

The Query Connector needs to connect to a FHIR server to fetch patient data. This server is typically provided by your data provider (like a healthcare organization) or a QHIN if connecting through TEFCA.

### FHIR server configuration

1. **Register Query Connector as a client**:
   
   - Work with your FHIR server administrator to register Query Connector as a client.
   - Obtain client credentials (client ID and secret) or appropriate authentication tokens.
   - Ensure your Query Connector's IP address/domain is allowlisted by the FHIR server.

2. **Configure connection in Query Connector**:
   Use the FHIR server configuration page in the Query Connector admin interface to add servers:
   
   - Server name: A descriptive name for the server
   - Server URL: The base URL of the FHIR server (e.g., `https://fhir.example.org/R4`)
   - Authentication method: Select from the supported methods
     - Bearer token
     - OAuth client credentials
     - SMART on FHIR with asymmetric key exchange

3. **Testing the connection**:
   
   - After configuration, test the connection using the test feature in the FHIR server configuration UI.
   - Verify that Query Connector can successfully authenticate and retrieve data.

4. **For multiple FHIR servers**:
   
   - Query Connector supports connecting to multiple FHIR servers.
   - Each server can be configured separately in the admin interface.
   - Users with appropriate permissions can select which server to query when running a search.

## Other considerations

### Environment variables

The following environment variables are required to run Query Connector. You can set them in a `.env` file in the root of your project or in your deployment environment.

```bash
# Database connection string
DATABASE_URL=postgresql://db-user@your-db-host:5432/tefca_db

# Authentication settings
AUTH_DISABLED=false
AUTH_SECRET="anysecretyoulike"

# Keycloak - set NEXT_PUBLIC_AUTH_PROVIDER to "keycloak"
# Entra ID - set NEXT_PUBLIC_AUTH_PROVIDER to "microsoft-entra-id" and AUTH_ISSUER to "https://login.microsoftonline.com/your-tenant-id/v2.0""
NEXT_PUBLIC_AUTH_PROVIDER=keycloak
AUTH_CLIENT_ID=my-client-id
AUTH_CLIENT_SECRET=my-client-secret
AUTH_ISSUER=https://idp-url/realms/yourrealm

# API keys
ERSD_API_KEY=
UMLS_API_KEY=
```

For more information on the ERSD and UMLS API keys, see [this API key documentation](development.md#obtaining-api-and-license-keys).

### Backup and disaster recovery

1. **Database backups**:
   
   - Set up regular backups of your PostgreSQL database.
   - For managed services, enable point-in-time recovery.
   - Test restoration procedures periodically.

2. **Application state**:
   
   - The application itself is stateless, so focus on database backups.
   - Consider backing up your configuration files and environment variables.

3. **Disaster recovery plan**:
   
   - Document your team's procedures for restoring the application from backups.
   - Consider implementing redundancy for critical components.
   - Set up monitoring and alerting for early detection of issues.

### Security recommendations

1. **Network security**:
   
   - Place Query Connector behind a reverse proxy or load balancer.
   - Configure proper SSL/TLS termination.
   - Implement network segmentation.
   - Set up Web Application Firewall (WAF) protection.

2. **Access controls**:
   
   - Use Query Connector's built-in role-based access controls.
   - Regularly audit user accounts and permissions.

3. **Compliance considerations**:
   
   - Ensure your deployment meets HIPAA requirements if handling PHI.
   - Use Query Connector's built-in audit logging for keeping a log of all patient data access.
   - Implement proper data retention policies.

### Upgrading

1. **Version upgrades**:
   
   - Check the [release notes](docs/release.md) for breaking changes.
   - Test upgrades in a non-production environment first.
   - Back up all data before upgrading.
   - Follow semantic versioning guidelines for understanding impact.

2. **Rollback procedures**:
   
   - Document rollback steps for each component.
   - Maintain previous container images for quick rollback.
   - Test rollback procedures as part of your upgrade planning.

## Getting help

If you encounter issues during deployment or operation of Query Connector, you can:

1. Check the [GitHub repository](https://github.com/CDCgov/dibbs-query-connector) for documentation and known issues.
2. Submit an issue on the GitHub repository.
3. Contact the DIBBs team at [dibbs@cdc.gov](mailto:dibbs@cdc.gov).
