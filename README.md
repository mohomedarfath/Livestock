# LivestockTrack

LivestockTrack is a multi-tenant farm operations platform for poultry, goat, and cattle workflows. It helps farm teams record daily work, monitor animal health, manage feed and inventory, track sales and expenses, and review financial performance from role-based dashboards.

The app is built as a SaaS-ready React frontend with Firebase-ready authentication, organization-aware data access, offline-friendly local persistence, responsive navigation, dark mode, and deployment support for Firebase Hosting, Vercel, Docker, and static hosting.

## Key Features

- Multi-animal workspace support for poultry, goats, cattle, and all-animal overview mode
- Role-based access for admin, manager, employee, accountant, and platform owner flows
- Organization onboarding, tenant-aware farm workspaces, and platform administration screens
- Dashboards for farm health, work activity, finances, charts, and smart suggestions
- Poultry and goat operations for groups, daily logs, feed efficiency, vaccinations, medicine, sales, and profit/loss
- Cattle operations for cow profiles, milk logs, milk passbook, breeding calendar, health and withdrawal tracking, and cow profitability
- Employee roster, employee activity logging, wage tracking, budgets, expenses, and accounting views
- Farm inventory, egg inventory, feed purchases, resource monitoring, pasture/free-range tracking, hatchery/incubation, vet notes, and compliance reports
- Shared UI system with tables, tabs, alerts, badges, skeletons, empty states, confirmation dialogs, toast messages, and command palette navigation
- Mobile-friendly app shell with collapsible sidebar, drawer navigation, bottom mobile navigation, breadcrumbs, and theme switching
- Online/offline sync indicator and IndexedDB-backed offline helpers
- Firebase, Supabase migration files, Docker, Nginx, Vitest, ESLint, and PWA configuration

## Tech Stack

- React 18
- Vite
- React Router
- Firebase client SDK
- Tailwind CSS
- Recharts
- IndexedDB helpers with `idb`
- Vitest
- ESLint
- Docker + Nginx

## Project Structure

```text
src/
  animal/          Animal type configuration and filtering
  app/             App module registry and access rules
  components/      Shared app, layout, animal, and UI components
  context/         Auth, tenant, theme, and sync providers
  features/        Offline draft and IndexedDB helpers
  hooks/           Data hooks for farm modules
  lib/             Firebase, environment, and browser storage helpers
  pages/           Feature pages grouped by role and animal workflow
  services/        Auth and repository/data access services
  utils/           Formatting, validation, navigation, and storage utilities
supabase/
  migrations/      Database migration references
scripts/           Firebase demo and rules test scripts
public/            Icons and web manifest assets
```

## Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Set the frontend Firebase values:

```bash
VITE_APP_NAME=LivestockTrack
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_ENABLE_LEGACY_DEMO=false
VITE_ENABLE_ERROR_TRACKING=false
```

Firebase client values are public frontend configuration values. Do not put private service-account keys or server secrets in `VITE_*` variables.

For local development only, set `VITE_ENABLE_LEGACY_DEMO=true` to enable the built-in demo fallback when Firebase is not configured.

## Local Development

Install dependencies:

```bash
npm install
```

Start the Vite dev server:

```bash
npm run dev
```

Default local URL:

```bash
http://localhost:5173
```

## Quality Checks

Run lint:

```bash
npm run lint
```

Run tests:

```bash
npm test
```

Build production assets:

```bash
npm run build
```

## Docker

The app is a static Vite frontend. Environment variables are compiled at image build time.

Run with Docker Compose:

```bash
docker compose up --build -d
```

Open the deployed app:

```bash
http://localhost:8080
```

Health check:

```bash
http://localhost:8080/healthz
```

Stop the app:

```bash
docker compose down
```

## Firebase Hosting

Login and select a Firebase project:

```bash
npm run firebase:login
npm run firebase:use
```

Build and deploy hosting:

```bash
npm run deploy:firebase
```

## Firebase Demo Data

The repo includes a demo seed script:

```bash
npm run seed:firebase
```

Use this only with the intended Firebase project and configuration.

## Main App Areas

- Dashboard
- Flocks, goat herds, and cattle herds
- Daily farm logs
- Employee activities
- Feed efficiency and feed costs
- Vaccinations and medicine logs
- Cow milk log, milk passbook, breeding, health, and profitability
- Egg inventory and incubation
- Farm inventory and resource monitoring
- Expenses, budgets, wages, sales, and profit/loss
- Employee roster and admin console
- Platform owner dashboard
- Compliance reports, vet notes, pasture tracking, and WhatsApp alert helpers

## Notes

- Keep real `.env` files out of Git. The repository includes `.env.example` for required keys.
- Historical audit, QA, and handoff documents are included for project context.
- Some legacy poultry-specific text remains in older reports and utility messages while the app continues its transition into a broader LivestockTrack platform.

