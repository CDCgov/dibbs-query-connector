# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DIBBs Query Connector is a Next.js 15 full-stack application for querying patient records across FHIR-compliant health information networks. It's built for public health jurisdictions to search healthcare data using standardized medical codes (LOINC, SNOMED).

## Common Commands

```bash
# Development (starts Docker services + Next.js with Turbopack)
npm run dev              # macOS/Linux — starts Postgres, Keycloak, Aidbox, then Next.js
npm run dev:db           # Docker services only
npm run dev:next         # Next.js only (services must already be running)

# Build
npm run build

# Linting
npm run lint             # ESLint with auto-fix

# Testing
npm run test:unit                          # Unit tests (Jest)
npm run test:unit:file -- <pattern>        # Single test file by pattern
npm run test:unit:watch                    # Watch mode
npm run test:integration                   # Integration tests (uses testcontainers for Postgres)
npm run test:playwright                    # E2E tests (Playwright — Firefox, Edge, Chrome)
npm run test:playwright:ui                 # E2E tests with interactive UI
npm run test:update                        # Update Jest snapshots
```

## Architecture

### Tech Stack
- **Next.js 15** with Turbopack, React 19, TypeScript 5.8 (strict mode)
- **PostgreSQL** via `pg-promise` — no ORM, raw SQL with parameterized queries
- **NextAuth v5 (beta)** for authentication (Keycloak or Microsoft Entra ID)
- **USWDS** (U.S. Web Design System) via `@trussworks/react-uswds` + SCSS
- **Flyway** for database migrations (`flyway/sql/`)

### Directory Layout

```
src/
  app/
    (pages)/           # Next.js route groups — each folder is a page
      queryBuilding/   # Query builder UI
      query/           # Query execution UI
      fhirServers/     # FHIR server management
      userManagement/  # User/group management
      auditLogs/       # Audit log viewer
      codeLibrary/     # Medical code browser
    api/               # API routes (REST endpoints)
      query/           # Main query execution API (GET with Bearer token auth)
      csv/             # CSV export
      auth/            # NextAuth handlers
    backend/           # Server-side services (not exposed directly)
      auth/            # Auth strategy pattern (Keycloak, Entra ID)
      db/              # Database connection pool (DbService, DbClient)
      query-building/  # Query CRUD operations
      query-execution/ # FHIR query execution engine
      fhir-servers/    # FHIR server client + management
      code-systems/    # Value sets and medical codes from VSAC/eRSD
      audit-logs/      # Audit logging with @auditable decorator
      user-management.ts
    ui/                # Shared React components and design system
    models/            # TypeScript interfaces
      entities/        # Domain models (Query, User, ValueSet, etc.)
      responses/       # API response types
    constants.ts       # App-wide constants
  auth.ts              # NextAuth configuration entry point
e2e/                   # Playwright E2E tests
flyway/sql/            # Database migration SQL files
```

### Key Patterns

**Database access**: Uses `DbService` (pool-based) and `DbClient` (transactional) classes in `src/app/backend/db/service.ts`. Queries use parameterized SQL, not an ORM. The `@camelCaseDbColumnNames` decorator auto-converts snake_case columns.

**Authentication**: Strategy pattern in `src/app/backend/auth/lib.ts`. The `AuthStrategy` interface has implementations for Keycloak and Entra ID. Pages are protected with the `withAuth` HOC or server-side `auth()` checks. Set `AUTH_DISABLED=true` in `.env` to skip auth locally.

**Audit logging**: The `@auditable` decorator on service methods tracks user actions for ONC compliance.

**FHIR integration**: Supports Basic Auth, OAuth2/SMART on FHIR, and mTLS connections to FHIR servers. Local dev uses Aidbox as a FHIR server.

**Medical code data flow**: Conditions → Value Sets → Concepts (LOINC/SNOMED codes). Seeded from eRSD and VSAC APIs, stored in Postgres.

### Path Aliases (tsconfig)
- `@/*` → `src/*`
- `@/app/*` → `src/app/*`
- `@/backend/*` → `src/app/backend/*`

## Testing

- **Unit tests** (Jest): Co-located as `*.test.ts(x)` files. Uses `jest-fixed-jsdom`, `@testing-library/react`, `jest-axe` for accessibility.
- **Integration tests** (Jest + testcontainers): Located in `src/app/tests/integration/`. Spins up a real Postgres container.
- **E2E tests** (Playwright): Located in `e2e/`. Runs against Firefox, Edge, Chrome with a global setup that ensures DB readiness.

## Code Style

- ESLint enforces `no-explicit-any` as an error
- Unused imports are errors (`eslint-plugin-unused-imports`)
- JSDoc required on public exports (`jsdoc/require-jsdoc` error), but disabled in test files
- Prettier for formatting

## Docker Services (docker-compose-dev.yaml)

Local dev runs: PostgreSQL (5432), Keycloak (8081), Aidbox FHIR server (8080), Flyway migrations, and an Aidbox seeder for test patient data.

## Environment Setup

Copy `.env.sample` to `.env`. Required API keys: `ERSD_API_KEY` (from ersd.aimsplatform.org), `UMLS_API_KEY` (from uts.nlm.nih.gov), `AIDBOX_LICENSE` (from aidbox.app). Default Keycloak credentials: `qc-admin / QcDev2024!`.
