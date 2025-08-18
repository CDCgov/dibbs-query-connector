[← Back to Documentation](/docs)

## API Documentation

The DIBBs Query Connector API is a RESTful API that allows public health staff to query a wide network of healthcare organizations (HCOs) for patient data.

- Interactive API documentation is available [here](/apiDocs).
- A Postman collection demonstrating use of the API can be found [here](https://github.com/CDCgov/dibbs-query-connector/blob/main/src/app/assets/DIBBs_Query_Connector_API.postman_collection.json).

## Authentication

The Query Connector API uses OAuth 2.0 Client Credentials flow for authentication. API requests must include a valid access token in the Authorization header.

### Quick Start

1. **Get an access token** using your client credentials
2. **Include the token** in your API requests: `Authorization: Bearer YOUR_ACCESS_TOKEN`

The specific setup depends on your identity provider:

- [Keycloak Setup](#keycloak-setup)
- [Microsoft Entra ID Setup](#microsoft-entra-id-setup)

---

## Keycloak Setup

Before you begin, ensure you have the following:

- Access to the Keycloak Admin Console
- Permissions to create clients and assign roles
- The main Query Connector client already created (e.g., `query-connector-client`) and configured with the `api-user` role

### 1. Create a Service Account Client

1. Log into your Keycloak Admin Console
2. Navigate to your realm → **Clients** → **Create client**
3. Configure the client:
   - **Client ID**: Choose a descriptive name (e.g., `my-api-client`)
   - **Client Protocol**: `openid-connect`
   - **Client Authentication**: `On`
   - **Authorization**: `Off`
   - **Authentication flow**: Disable all except "Service accounts roles"
4. Save the client

### 2. Get Client Credentials

1. Go to your client → **Credentials** tab
2. Copy the **Client Secret** (you'll need this to get tokens)

### 3. Assign the API User Role

1. Go to your client → **Service Account Roles** tab
2. Click **Assign role**
3. Search for and select the `api-user` role on the Query Connector client
4. Click **Assign**

### 4. Get an Access Token

```bash
curl -X POST "https://YOUR_KEYCLOAK_URL/realms/YOUR_REALM/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "grant_type=client_credentials"
```

Example response:

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI...",
  "expires_in": 300,
  "token_type": "Bearer"
}
```

### 5. Use the Token

Include the access token in your API requests:

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  "https://queryconnector.dev/api/query?fhir_server=SERVER_NAME&id=QUERY_ID"
```

---

## Microsoft Entra ID Setup

Before you begin, ensure you have the following:

- Access to the Azure Portal
- Permissions to create app registrations and manage API permissions
- The main Query Connector application already registered in Microsoft Entra ID with the `api-user` app role defined

### 1. Create an App Registration

1. Log into the [Azure Portal](https://portal.azure.com)
2. Navigate to **Microsoft Entra ID** → **App registrations** → **New registration**
3. Configure the registration:
   - **Name**: Choose a descriptive name (e.g., `QC API Client - Production`)
   - **Supported account types**: "Accounts in this organizational directory only"
4. Click **Register**

### 2. Create Client Secret

1. Go to your app registration → **Certificates & secrets**
2. Click **New client secret**
3. Add a description and expiration period
4. Click **Add**
5. **Copy the secret value immediately** (it won't be shown again)

### 3. Request API Access

1. Go to **API permissions** → **Add a permission**
2. Click **My APIs**
3. Select the Query Connector application
4. Choose **Application permissions**
5. Select the `api-user` permission
6. Click **Add permissions**
7. Click **Grant admin consent** (requires admin privileges)

### 4. Assign the App Role

> **Note**: This step requires Azure CLI or PowerShell as it cannot be done through the portal.

Using Azure CLI:

```bash
# Get the necessary IDs
CLIENT_APP_ID="YOUR_CLIENT_APP_ID"
QC_APP_ID="QUERY_CONNECTOR_APP_ID"

# Get service principal IDs
CLIENT_SP=$(az ad sp show --id $CLIENT_APP_ID --query id -o tsv)
RESOURCE_SP=$(az ad sp show --id $QC_APP_ID --query id -o tsv)

# Get the api-user role ID
APP_ROLE_ID=$(az ad sp show --id $QC_APP_ID --query "appRoles[?value=='api-user'].id" -o tsv)

# Create the role assignment
az rest --method POST \
  --uri "https://graph.microsoft.com/v1.0/servicePrincipals/$CLIENT_SP/appRoleAssignments" \
  --body "{\"principalId\": \"$CLIENT_SP\", \"resourceId\": \"$RESOURCE_SP\", \"appRoleId\": \"$APP_ROLE_ID\"}"
```

### 5. Get an Access Token

```bash
curl -X POST "https://login.microsoftonline.com/YOUR_TENANT_ID/oauth2/v2.0/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "scope=api://QUERY_CONNECTOR_APP_ID/.default" \
  -d "grant_type=client_credentials"
```

Example response:

```json
{
  "token_type": "Bearer",
  "expires_in": 3599,
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIs..."
}
```

### 6. Use the Token

Include the access token in your API requests:

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  "https://queryconnector.dev/api/query?fhir_server=SERVER_NAME&id=QUERY_ID"
```

---

## Token Management Best Practices

1. **Cache tokens**: Tokens are valid until expiration. Cache and reuse them instead of requesting new ones for each API call.

2. **Handle expiration**: Check the `expires_in` value and refresh tokens before they expire.

3. **Secure storage**: Store client secrets securely using environment variables or secret management systems.

4. **Error handling**: If you receive a 401 Unauthorized error, get a new token and retry the request.

## Troubleshooting

### 401 Unauthorized

- **Token expired**: Get a new token
- **Missing role**: Verify the `api-user` role is assigned to your client
- **Wrong audience**: For Entra, ensure you're using the correct scope

### Invalid Token Errors

- **Malformed token**: Ensure you're sending only the token value, not the entire response object
- **Wrong identity provider**: Verify you're using the correct token endpoint for your environment

## Need Help?

- Check the [interactive API documentation](/apiDocs) for detailed endpoint information
- Review the [Postman collection](https://github.com/CDCgov/dibbs-query-connector/blob/main/src/app/assets/DIBBs_Query_Connector_API.postman_collection.json) for working examples
- Contact your system administrator for client credentials or role assignments
