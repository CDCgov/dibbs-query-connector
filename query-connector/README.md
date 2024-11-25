## Getting Started with Query Connector

### Introduction

The DIBBs Query Connector app offers a REST API for searching for a patient and viewing information tied to your case investigation.

### Running Query Connector

The Query Connector app can be run using Docker (or any other OCI container runtime e.g., Podman), or directly from the Node.js source code.

#### Obtaining an eRSD API Key

Before running the Query Connector locally, you will need to obtain an API key for the electronic Reporting and Surveillance Distribution (eRSD). With the API key, you have access to 200+ pre-built queries for reportable conditions, e.g., chlamydia, influenza, hepatitis A, etc. These queries can be used and modified in the Query Connector app.

To obtain a free API key, please visit [https://ersd.aimsplatform.org/#/api-keys](https://ersd.aimsplatform.org/#/api-keys) and follow the sign up instructions.

Next, set up your `.env` file with the following command: `cp .env.sample .env`

Adjust your `DATABASE_URL` as needed.

Add your API keys as an environment variables called `ERSD_API_KEY` and `UMLS_API_KEY` in the `.env` file so that they can be accessed when running the Query Connector app.

#### Running Keycloak for Authentication

```
docker compose -f docker-compose-dev.yaml up keycloak
```

To login via Keycloak, make sure your `.env` is updated using `cp` command above and use the following credentials to login at `localhost:8080` after spinning up the container:

```
Username: qc-admin
Password: QcDev2024!
```

Next, run the app with `npm run dev` or `npm run dev-win`. You should see a sign in button at [http://localhost:3000](http://localhost:3000). Click it and login with the above credentials, and it should redirect back to [http://localhost:3000/query](http://localhost:3000/query)!

#### Running with Docker (Recommended)

To run the Query Connector app with Docker, follow these steps.

1. Confirm that you have Docker installed by running `docker -v`. If you do not see a response similar to what is shown below, follow [these instructions](https://docs.docker.com/get-docker/) to install Docker.

```
❯ docker -v
Docker version 20.10.21, build baeda1f
```

2. Download a copy of the Docker image from the PHDI repository by running `docker pull ghcr.io/cdcgov/phdi/query-connector:latest`.
   1. If you're using an M1 Mac, you'll need to tell Docker to pull the non-Apple Silicon image using `docker pull --platform linux/amd64 ghcr.io/cdcgov/phdi/query-connector:latest` since we don't have a image for Apple Silicon. If you're using this setup, there might be some issues with architecture incompatability that the team hasn't run into, so please flag if you run into something!
3. Run the service with `docker run -p 3000:3000 query-connector:latest`. If you're on a Windows machine, you may need to run `docker run -p 3000:3000 ghcr.io/cdcgov/phdi/query-connector:latest` instead.

Congratulations, the Query Connector app should now be running on `localhost:3000/query-connector`!

#### Running from Node.js Source Code

We recommend running the Query Connector app from a container, but if that is not feasible for a given use-case, it may also be run directly from Node using the steps below.

1. Ensure that both Git and Node 18.x or higher are installed.
2. Clone the PHDI repository with `git clone https://github.com/CDCgov/phdi`.
3. Navigate to `/phdi/containers/query-connector/`.
4. Install all of the Node dependencies for the Query Connector app with `npm install`.
5. Run the Query Connector app on `localhost:3000` with `npm run dev`. If you are on a Windows Machine, you may need to run `npm run dev-win` instead.

### Building the Docker Image

To build the Docker image for the Query Connector app from source instead of downloading it from the PHDI repository follow these steps.

1. Ensure that both [Git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) and [Docker](https://docs.docker.com/get-docker/) are installed.
2. Clone the PHDI repository with `git clone https://github.com/CDCgov/phdi`.
3. Navigate to `/phdi/containers/query-connector/`.
4. Run `docker build -t query-connector .`.

### Running via docker-compose (WIP)

The Query Connector will eventually require other inputs from other DIBBs services. For now, this is a simplified docker compose file that starts the Node service. This can be run with `docker compose up --build`. See the [Docker Compose documentation](https://docs.docker.com/engine/reference/commandline/compose_up/) for additional information.

### Developer Documentation

A Postman collection demonstrating use of the API can be found [here](https://github.com/CDCgov/dibbs-query-connector/blob/main/query-connector/src/app/assets/DIBBs_Query_Connector_API.postman_collection.json).

### Architecture Diagram

```mermaid
graph TD
  subgraph Next.js App
    direction TB

    A[API Route] -->|GET Request| B[Next.js Server]
    A[API Route] -->|POST Request| B[Next.js Server]

    B --> C[UseCaseQuery Service]
    B --> D[Parsing Service]
    B --> E[Error Handling Service]

    C --> F[Query FHIR Server]
    D --> G[Parse Patient Demographics]
    E --> H[Handle Errors]

    subgraph Pages
      direction TB
      P1[Page 1: index.js]
      P2[Page 2: about.js]
      P3[Page 3: contact.js]
      P4[Page 4: patients.js]
      P5[Page 5: usecases.js]
    end

    B --> P1
    B --> P2
    B --> P3
    B --> P4
    B --> P5
  end

  subgraph External Services
    direction TB
    I[FHIR Servers]
  end

  F -->|Query| I

  %% Legends
  classDef next fill:#f9f,stroke:#333,stroke-width:4px,color:#000;
  classDef pages fill:#d3f9d8,stroke:#333,stroke-width:4px,color:#000;
  classDef external fill:#9f9,stroke:#333,stroke-width:4px,color:#000;

  class A,B,C,D,E,F,G,H next;
  class P1,P2,P3,P4,P5 pages;
  class I external;
```
