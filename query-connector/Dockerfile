FROM node:22-alpine AS base

FROM base AS installer

RUN apk update
RUN apk add --no-cache libc6-compat bash curl git go

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

# Download jwksetinfer tool
RUN git clone https://github.com/MicahParks/jwkset.git \
    && cd jwkset/cmd/jwksetinfer \
    && go build

# Final stage for running the app
FROM base AS runner
WORKDIR /app

RUN apk add --no-cache bash openjdk17-jre openssl uuidgen jq

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
COPY --from=installer /app/next.config.js .
COPY --from=installer /app/package.json .
COPY --from=installer /app/flyway/conf/flyway.conf ../flyway/conf/flyway.conf
COPY --from=installer /app/flyway/sql ../flyway/sql
COPY --from=installer /app/src/app/assets ./.next/server/app/assets
COPY --from=installer /app/jwkset/cmd/jwksetinfer/jwksetinfer /usr/local/bin/jwksetinfer

# Automatically leverage output traces to reduce image size
COPY --from=installer --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=installer --chown=nextjs:nodejs /app/public ./public
COPY --from=installer --chown=nextjs:nodejs /app/start.sh ./start.sh
RUN ls -R
# Set environment variables for Flyway and Node.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

# Set JAVA_HOME to the OpenJDK version installed by apk for Flyway
ENV JAVA_HOME=/usr/lib/jvm/default-jvm
# Add the OpenJDK to the PATH so the java command is available for Flways
ENV PATH=$JAVA_HOME/bin:$PATH

ENTRYPOINT ["/bin/bash"]
CMD ["/app/start.sh"]
