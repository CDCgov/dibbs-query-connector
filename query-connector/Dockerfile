FROM node:20-alpine AS base

FROM base AS installer

RUN apk update
RUN apk add --no-cache libc6-compat
RUN apk add --no-cache bash curl

WORKDIR /app
COPY . .

# Install Flyway and remove JRE directory to force flyway to use the openjdk11 version in the runner
ENV FLYWAY_VERSION=10.19.0
RUN curl -L https://repo1.maven.org/maven2/org/flywaydb/flyway-commandline/${FLYWAY_VERSION}/flyway-commandline-${FLYWAY_VERSION}-linux-x64.tar.gz -o flyway.tar.gz \
    && tar -zxvf flyway.tar.gz \
    && mv flyway-${FLYWAY_VERSION} /flyway \
    && ln -s /flyway/flyway /usr/local/bin/flyway \
    && rm flyway.tar.gz \
    && rm -rf /flyway/jre \
    && chmod +x /flyway/flyway

# Build the project
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm ci
RUN npm run build

# Final stage for running the app
FROM base AS runner
WORKDIR /app

RUN apk add --no-cache bash openjdk17-jre

# Copy Flyway from the installer stage
COPY --from=installer /flyway /flyway
RUN chmod +x /flyway/flyway
# Create symlink to run Flyway from anywhere in the container
RUN ln -s /flyway/flyway /usr/local/bin/flyway

# Don't run production as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Set hostname to localhost
ENV HOSTNAME="0.0.0.0"

# Copy necessary app files
COPY --from=installer --chown=nextjs:nodejs /app/next.config.js .
COPY --from=installer --chown=nextjs:nodejs /app/package.json .
COPY --from=installer --chown=nextjs:nodejs /app/flyway/conf/flyway.conf ../flyway/conf/flyway.conf
COPY --from=installer --chown=nextjs:nodejs /app/flyway/sql ../flyway/sql

# Automatically leverage output traces to reduce image size
COPY --from=installer --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=installer --chown=nextjs:nodejs /app/public ./public
RUN ls -R
# Set environment variables for Flyway and Node.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1


# Set JAVA_HOME to the OpenJDK version installed by apk for Flyway
ENV JAVA_HOME=/usr/lib/jvm/default-jvm
# Add the OpenJDK to the PATH so the java command is available for Flways
ENV PATH=$JAVA_HOME/bin:$PATH

CMD ["sh", "-c","flyway -configFiles=../flyway/conf/flyway.conf -schemas=public -connectRetries=60 migrate && echo done with flyway && node server.js"]