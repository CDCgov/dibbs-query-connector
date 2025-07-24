# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DIBBs Query Connector is a Next.js application that provides a REST API and UI for public health staff to query healthcare organizations (HCOs) for patient records. It supports both direct FHIR queries and connections to Qualified Health Information Networks (QHINs) within TEFCA.

## Development Commands

### Core Development
- `npm run dev` - Start development server with Docker services (preferred)
- `npm run dev-win` - Windows-specific development command
- `npm run dev:db` - Start just the database services
- `npm run dev:next` - Start Next.js without Docker services
- `npm run setup-local-env` - Run environment setup script

### Build and Deploy
- `npm run build` - Build for production
- `npm run start` - Start production server

### Code Quality
- `npm run lint` - Run ESLint with auto-fix
- `npm run test` - Run all tests (unit + integration)
- `npm run test:unit` - Run unit tests only
- `npm run test:unit:watch` - Run unit tests in watch mode
- `npm run test:integration` - Run integration tests
- `npm run test:ci` - Run tests in CI environment

### End-to-End Testing
- `npm run test:playwright` - Run Playwright e2e tests
- `npm run test:playwright:ui` - Run Playwright with UI mode

## Architecture

### Directory Structure
- `src/app/` - Next.js app directory structure
  - `(pages)/` - Page routes (auditLogs, query, queryBuilding, userManagement, etc.)
  - `api/` - API routes and handlers
  - `backend/` - Backend services and business logic
  - `models/` - Data models and entity definitions
  - `shared/` - Shared utilities and constants
  - `ui/` - UI components and design system
  - `utils/` - Utility functions
- `src/docs/` - Documentation files
- `e2e/` - End-to-end tests
- `flyway/` - Database migrations
- `terraform/` - Infrastructure as code

### Key Technologies
- **Frontend**: Next.js 15, React 19, TypeScript, SCSS
- **Backend**: Next.js API routes, PostgreSQL, Flyway migrations
- **Authentication**: NextAuth.js with Keycloak
- **Testing**: Jest (unit), Playwright (e2e), Testing Library
- **Styling**: USWDS (US Web Design System), SCSS modules
- **Development**: Docker Compose, ESLint, Prettier

### Database
- PostgreSQL database with Flyway migrations
- Key tables: conditions, valuesets, concepts, queries, fhir_servers, users
- Local development uses Docker Compose database
- Database seeding from eRSD and UMLS APIs

### Authentication
- NextAuth.js with Keycloak provider
- Session management with timeout handling
- Role-based access control
- Auth can be disabled via AUTH_DISABLED environment variable

## Key Components

### Query Building (`src/app/(pages)/queryBuilding/`)
- Condition selection and value set management
- Integration with eRSD and UMLS APIs
- Custom query creation and templates

### Query Execution (`src/app/(pages)/query/`)
- Patient search functionality
- FHIR server integration
- Results visualization and export

### FHIR Integration (`src/app/shared/fhirClient.ts`)
- FHIR R4 client implementation
- Support for multiple FHIR servers
- SMART on FHIR authentication

### User Management (`src/app/(pages)/userManagement/`)
- User roles and permissions
- Team query access control
- User group management

## Environment Setup

### Required Environment Variables
- `ERSD_API_KEY` - eRSD API access
- `UMLS_API_KEY` - UMLS API access
- `AIDBOX_LICENSE` - Aidbox FHIR server license
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - NextAuth.js secret
- `AUTH_DISABLED` - Optional auth bypass for development

### Local Development Setup
1. Copy `.env.sample` to `.env`
2. Obtain API keys from eRSD, UMLS, and Aidbox
3. Run `npm install`
4. Run `npm run dev`

## Testing

### Unit Tests
- Located alongside source files
- Use Jest and Testing Library
- Run with `npm run test:unit`

### Integration Tests
- Located in `src/app/tests/integration/`
- Test database interactions and API endpoints
- Use Testcontainers for database testing

### E2E Tests
- Located in `e2e/`
- Use Playwright for browser testing
- Test complete user workflows

## Code Patterns

### File Organization
- Co-locate tests with source files
- Use `.module.scss` for component-specific styles
- Organize by feature/page in `(pages)/` directory

### Component Structure
- Use TypeScript interfaces for props
- Implement proper error boundaries
- Follow accessibility guidelines (USWDS patterns)

### API Routes
- Error handling via `error-handling-service.ts`
- Authentication middleware
- Structured response formats

### Database Services
- Use decorators for audit logging
- Implement proper transaction handling
- Service layer abstraction in `src/app/backend/`

## Common Tasks

### Adding New FHIR Server
1. Update `fhir_servers` table via migration
2. Add configuration in FHIR servers admin page
3. Test connection and authentication

### Creating New Query Template
1. Add condition to eRSD mapping
2. Create value set associations
3. Test query building and execution

### Adding New Page
1. Create directory in `src/app/(pages)/`
2. Implement `page.tsx` with proper authentication
3. Add navigation links if needed
4. Write tests for new functionality

## Deployment

### Docker
- Uses multi-stage build process
- Standalone output for production
- Environment-specific configurations

### Infrastructure
- Terraform modules for AWS ECS and VM deployment
- Supports both ECS and traditional VM architectures
- Environment-specific variable files