# Precision Notes Platform Admin

The internal operations console for the Precision Notes platform. It is used by authorized platform administrators to manage tenants, plans, billing operations, reporting, transcription providers, sandbox tools, administrative users, and platform configuration.

This is not the clinical workspace used by doctors. It operates against privileged `/platform-admin`, `/admin`, `/tenants`, and reporting APIs exposed by the Precision Notes Backend.

## What this project is for

- Monitor platform-wide organizations, usage, revenue, plan adoption, provider health, and operational status.
- Create, inspect, update, suspend, or remove tenant organizations.
- Manage plan catalogs, feature limits, prices, contract-plan assignments, transactions, and webhook events.
- Manage platform-admin accounts, permissions, passwords, and active sessions.
- Configure transcription providers and inspect live transcription sessions.
- Exercise controlled transcription, document-generation, failover, and webhook sandbox workflows.
- Maintain platform-level configuration without exposing these controls to tenant users.

## Main areas

| Route | Purpose | Permission |
| --- | --- | --- |
| `/admin/overview` | Platform health and operational overview | Authenticated admin |
| `/admin/organizations` | Tenant lifecycle and usage management | `organizations` |
| `/admin/plans-billing` | Plans, feature limits, pricing, and payment operations | `billing` |
| `/admin/reports` | Usage and staff-utilization reporting | `analytics` |
| `/admin/sandbox` | Provider and workflow test tools | `sandbox` |
| `/admin/platform-admins` | Admin accounts and sessions | `platform_admins` |
| `/admin/settings` | Platform configuration | `settings` |

Authentication begins at `/admin/login`. Protected routes enforce the permission set returned for the active platform administrator.

## Technology

- React 18 and TypeScript
- Vite
- React Router
- TanStack Query
- Tailwind CSS and shadcn/Radix UI components
- React Hook Form and Zod
- Recharts
- Sentry browser monitoring
- Vercel SPA hosting configuration

## Local development

### Requirements

- Node.js 18 or newer
- npm or pnpm
- A running Precision Notes Backend with platform-admin access configured

### Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

The default API target is `http://localhost:8080`.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `VITE_PLATFORM_ADMIN_API_BASE_URL` | Base URL of the Precision Notes Backend |
| `VITE_SENTRY_DSN` | Optional Sentry project DSN |
| `VITE_SENTRY_ENVIRONMENT` | Monitoring environment name |
| `VITE_SENTRY_RELEASE` | Release identifier attached to events |
| `VITE_SENTRY_TRACES_SAMPLE_RATE` | Browser tracing sample rate |
| `VITE_SENTRY_REPLAY_SESSION_SAMPLE_RATE` | Session replay sample rate |
| `VITE_SENTRY_REPLAY_ERROR_SAMPLE_RATE` | Replay-on-error sample rate |

The API client sends the backend-issued platform-admin session token through both `X-Platform-Admin-Token` and `Authorization: Bearer …`. Never place admin credentials or session tokens in source code or committed environment files.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local Vite server |
| `npm run build` | Create a production build in `dist/` |
| `npm run build:dev` | Build using Vite's development mode |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build |

## Project structure

```text
src/
├── components/admin/     Admin layout, navigation, headers, and form helpers
├── components/ui/        Shared shadcn/Radix UI primitives
├── contexts/             Platform-admin authentication and session state
├── pages/admin/          Operational feature pages
├── services/             Typed platform-admin API access
├── providers/            Cross-cutting providers such as notifications
├── types/                Platform and transcription contracts
├── App.tsx                Routes and permission boundaries
└── main.tsx               Application bootstrap
```

## Backend relationship

The console expects the Precision Notes Backend to provide:

- platform-admin login, logout, password, user, and session APIs;
- tenant lifecycle and tenant-user APIs;
- billing catalog, payment transaction, and webhook-event APIs;
- platform analytics and reporting APIs;
- transcription provider, live-session, and sandbox APIs.

Backend authorization remains authoritative. Hiding a route in this frontend is not a substitute for server-side permission checks.

## Deployment

Build the static application with `npm run build` and deploy `dist/`. The included Vercel configuration supports client-side routes. Configure the production backend URL and Sentry settings in the deployment environment.

## Verification

```bash
npm run lint
npm run build
```

There is currently no automated test script. Before release, smoke-test login, permission-restricted navigation, tenant updates, plan and price editing, reporting filters, provider configuration, and logout against a non-production backend.

## Security notes

- Treat this as a privileged internal application.
- Never commit tokens, provider keys, patient data, or production exports.
- Use HTTPS outside local development.
- Keep the backend CORS allowlist and platform-admin session policy restricted to approved environments.
