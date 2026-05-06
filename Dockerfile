FROM node:24-alpine AS base

FROM base AS installer

RUN apk update && apk upgrade
RUN apk add --no-cache libc6-compat bash curl openssl

WORKDIR /app
COPY . .

# Download AWS RDS global CA bundle for SSL database connections
RUN curl --fail --show-error -L https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem \
    -o /rds-global-bundle.pem

# Download Azure Database for PostgreSQL CA bundle (DigiCert Global Root CA,
# DigiCert Global Root G2, Microsoft RSA Root CA 2017) and concatenate to one PEM.
RUN mkdir -p /tmp/azure-certs \
    && curl --fail --show-error -L -o /tmp/azure-certs/digicert-global-root.pem \
         https://dl.cacerts.digicert.com/DigiCertGlobalRootCA.crt.pem \
    && curl --fail --show-error -L -o /tmp/azure-certs/digicert-global-root-g2.pem \
         https://dl.cacerts.digicert.com/DigiCertGlobalRootG2.crt.pem \
    && curl --fail --show-error -L -o /tmp/azure-certs/ms-rsa-root-2017.der \
         "https://www.microsoft.com/pkiops/certs/Microsoft%20RSA%20Root%20Certificate%20Authority%202017.crt" \
    && openssl x509 -inform DER -in /tmp/azure-certs/ms-rsa-root-2017.der \
         -outform PEM -out /tmp/azure-certs/ms-rsa-root-2017.pem \
    && cat /tmp/azure-certs/digicert-global-root.pem \
           /tmp/azure-certs/digicert-global-root-g2.pem \
           /tmp/azure-certs/ms-rsa-root-2017.pem \
         > /azure-postgres-bundle.pem \
    && rm -rf /tmp/azure-certs

# Install Flyway and remove JRE directory to force flyway to use the openjdk11 version in the runner
ENV FLYWAY_VERSION=10.19.0
RUN curl -L https://repo1.maven.org/maven2/org/flywaydb/flyway-commandline/${FLYWAY_VERSION}/flyway-commandline-${FLYWAY_VERSION}-linux-x64.tar.gz -o flyway.tar.gz \
    && tar -zxvf flyway.tar.gz \
    && mv flyway-${FLYWAY_VERSION} /flyway \
    && ln -s /flyway/flyway /usr/local/bin/flyway \
    && rm flyway.tar.gz \
    && rm -rf /flyway/jre \
    && chmod +x /flyway/flyway \
    && rm -rf /flyway/drivers/databricks-jdbc-*.jar \
              /flyway/drivers/mssql-jdbc-*.jar \
              /flyway/drivers/snowflake-jdbc-*.jar \
              /flyway/drivers/cassandra/ \
              /flyway/drivers/gcp/

# Build the project
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm ci
RUN npm run build

# Final stage for running the app
FROM base AS runner
WORKDIR /app

RUN apk update && apk upgrade && apk add --no-cache bash openjdk17-jre
# Copy RDS CA bundle for SSL database connections
COPY --from=installer /rds-global-bundle.pem /app/certs/rds-global-bundle.pem
# Copy Azure PostgreSQL CA bundle for SSL database connections
COPY --from=installer /azure-postgres-bundle.pem /app/certs/azure-postgres-bundle.pem
# Copy Flyway from the installer stage
COPY --from=installer /flyway /flyway
RUN chmod +x /flyway/flyway
# Create symlink to run Flyway from anywhere in the container
RUN ln -s /flyway/flyway /usr/local/bin/flyway

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Ensure writable directories
RUN mkdir -p /app /data /logs && \
    chown -R nextjs:nodejs /app /data /logs

# Set hostname to localhost
ENV HOSTNAME="0.0.0.0"

# Copy necessary app files
COPY --from=installer /app/next.config.mjs .
COPY --from=installer /app/package.json .
COPY --from=installer /app/flyway/conf/flyway.conf ../flyway/conf/flyway.conf
COPY --from=installer /app/flyway/sql ../flyway/sql
COPY --from=installer /app/src/app/assets ./.next/server/app/assets

# Automatically leverage output traces to reduce image size
COPY --from=installer --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=installer --chown=nextjs:nodejs /app/public ./public
COPY --from=installer --chown=nextjs:nodejs /app/start.sh ./start.sh

RUN mkdir -p .next/static public && \
    chown -R nextjs:nodejs .next/static public

USER nextjs


RUN ls -R
# Set environment variables for Flyway and Node.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Set JAVA_HOME to the OpenJDK version installed by apk for Flyway
ENV JAVA_HOME=/usr/lib/jvm/default-jvm
# Add the OpenJDK to the PATH so the java command is available for Flways
ENV PATH=$JAVA_HOME/bin:$PATH

ENTRYPOINT ["/bin/bash"]
CMD ["/app/start.sh"]
