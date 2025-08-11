# Using Azure Private Endpoint with App Service 

## 1. Keep the host as the FQDN for the DATABASE_URL

Use the normal Azure PostgreSQL host in your connection string, for example:

```
pgflexserver-qc-12345f.postgres.database.azure.com
```

Example connection string:

```
postgres://testuser:testpasswd@pgflexserver-qc-12345f.postgres.database.azure.com:5432/qc_db?sslmode=require
```

> **Note:** Do **not** use `localhost` and do **not** use the raw IP.

---

## 2. Make the Database's FQDN resolve to the private IP

1. Navigate to **Azure Database for PostgreSQL Flexible Server** → click your server name → **Settings** → **Networking**.
2. Scroll down to **Private DNS integration** and copy the name of the **Private DNS Zone**.
3. Paste that into the Azure portal search bar. Select your **Private DNS Zone**.
4. Navigate to **DNS Management** → **Recordsets**.
5. Create or verify a **Private DNS zone**:  
   `privatelink.postgres.database.azure.com`.
6. Add an **A record** for your server name (e.g., `pgflexserver-qc-12345f`) pointing to the **private endpoint IP**.
7. **Link** that Private DNS zone to the **VNet** your App Service is integrated with (Regional VNet Integration).
8. Once linked, your App Service will automatically resolve `pgflexserver-qc-12345f.postgres.database.azure.com` to the **private IP**.

---

## 3. Verify name resolution from App Service

1. In **Azure Portal**, go to your **App Service**.
2. In the left menu, select **Advanced Tools** → **Go** (opens **Kudu** in a new tab).
3. In Kudu, select **Bash**.
4. Run: 
``` 
nslookup pgflexserver-qc-12345f.postgres.database.azure.com 
```

