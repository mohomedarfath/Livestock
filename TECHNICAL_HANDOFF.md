# CluckTrack Technical Handoff

Last updated: April 3, 2026

## 1. What This Project Is

CluckTrack is a poultry farm management application built with React and Vite.

It started as a single-farm browser prototype and has since been expanded into a SaaS-oriented multi-tenant foundation. The app now supports:

- Farm operations management
- Finance tracking
- Egg and farm inventory
- Role-based access
- Tenant-aware workspace switching
- A platform-owner control layer for selling the product to multiple farms

At the moment, the app is a hybrid:

- The SaaS shell, tenant concepts, role access, onboarding, and Docker deployment are in place.
- A large part of the business data still runs in legacy demo/local browser storage.
- Supabase integration exists, but the newer platform-owner and custom-role features are still mostly demo-mode scaffolding and are not fully migrated to backend persistence yet.

## 2. Current Product Scope

### Farm workspace modules

Main farm modules currently available in the app:

- Dashboard
- Flocks
- Daily Log
- Activities
- Vaccines
- Medicine
- Feed Costs
- Farm Inventory
- Egg Inventory
- Expenses
- Budget Planning
- Wage Tracking
- Sales
- FCR
- Profit & Loss
- Employees
- Farm Admin Console
- Settings

### Platform-level features

A new super-admin layer now exists outside any single farm workspace. It supports:

- Viewing all farm tenants
- Creating new farm tenants
- Monitoring usage across tenants
- Changing subscription status
- Impersonating a farm workspace for support

### Farm admin features

Each farm tenant now has a farm admin console for:

- Inviting users
- Assigning roles
- Revoking and restoring user access
- Defining custom roles
- Assigning module access per role
- Managing tenant-scoped organization settings

## 3. High-Level Architecture

### Frontend stack

- React 18
- Vite
- React Router
- Tailwind CSS
- Recharts

### Runtime modes

The app currently supports two operating modes:

1. Supabase mode
- Real auth and tenant-backed data for some repositories

2. Legacy demo mode
- Local browser storage
- Seeded demo data
- Platform/tenant simulation

Legacy demo mode is still heavily used during development.

### Main app flow

The current runtime flow is:

`AuthProvider -> TenantProvider -> route selection -> platform dashboard or tenant app shell -> feature pages -> repositories -> Supabase or local demo storage`

### Important architectural point

The tenant/workspace concept is real at the shell level, but many feature pages still read from localStorage-based state. In demo mode, tenant switching works by loading the selected tenant snapshot into the same legacy storage keys. This makes the app feel tenant-aware without every legacy page being fully rewritten yet.

That is the biggest technical compromise in the current codebase.

## 4. Key Application Layers

### Auth

File:

- `src/services/auth/authService.ts`

Responsibilities:

- Chooses between Supabase auth and legacy demo auth
- Supports the platform owner demo login
- Loads the current user session

### Tenant and access context

File:

- `src/context/TenantContext.jsx`

Responsibilities:

- Loads memberships
- Tracks current organization
- Tracks current role
- Tracks impersonation state
- Loads tenant role definitions
- Computes accessible modules
- Exposes `canAccessModule()`

This is now the main source of truth for tenant-aware access.

### Module registry

File:

- `src/app/modules.jsx`

Responsibilities:

- Defines app modules
- Defines route path, label, title, icon, navigation group
- Defines default role access

This is still the feature registry for the app.

### Access control

File:

- `src/app/accessControl.js`

Responsibilities:

- Defines default system roles
- Builds default role definitions from modules
- Normalizes custom role definitions
- Resolves whether a role can access a module
- Computes accessible module lists for the current role

This is the new layer that makes custom roles work without re-login.

### Platform repository

File:

- `src/services/repositories/platformRepository.js`

Responsibilities:

- Demo-mode tenant registry
- Membership management
- Role definition persistence
- Tenant snapshot switching
- Subscription status changes
- Impersonation state
- Tenant-scoped user CRUD

This file is the main SaaS/platform scaffolding in demo mode.

### App routing

File:

- `src/App.jsx`

Responsibilities:

- Directs users to `/auth`, `/onboarding`, `/platform`, or `/app`
- Protects route access with `canAccessModule()`
- Separates platform owner flow from farm workspace flow

## 5. Routing Overview

### Authentication

- `/auth`
- `/login` -> redirects to `/auth`

### Onboarding

- `/onboarding`

### Platform owner

- `/platform`

### Farm workspace

- `/app`
- `/app/flocks`
- `/app/daily-log`
- `/app/activities`
- `/app/my-activities`
- `/app/fcr`
- `/app/vaccinations`
- `/app/medicine`
- `/app/feed`
- `/app/inventory`
- `/app/eggs`
- `/app/expenses`
- `/app/budgets`
- `/app/wages`
- `/app/sales`
- `/app/profit`
- `/app/employees`
- `/app/users`
- `/app/settings`

There are also phase-2 / labs routes such as compliance, incubation, pasture, and energy/water monitoring.

## 6. Roles and Access Model

### Built-in farm roles

- `admin`
- `manager`
- `employee`
- `accountant`

### Platform role

- `super_admin`

### Current role behavior

- Farm roles are tenant-scoped
- Farm admins can create custom roles
- Custom roles inherit a base dashboard role
- Module access can be granted per custom role
- Changes take effect immediately during the active session

### Important note

The old module definitions still include static `roles` arrays. These are now treated as defaults. The actual live access decision should be considered to come from:

- `TenantContext`
- `accessControl.js`
- `canAccessModule()`

## 7. Current Inventory and Sales Features

### Egg inventory

Added recently:

- Shared egg inventory utility/repository/hook
- Egg collection from Daily Log adds stock
- Egg sales deduct stock
- Support for pieces, dozens, and trays

Main files:

- `src/utils/eggInventory.js`
- `src/services/repositories/eggInventoryRepository.js`
- `src/hooks/useEggInventory.js`
- `src/pages/EggInventory.jsx`

### Farm inventory

Added recently:

- Feed
- Medicine
- Water reserve
- Supplements
- Bedding/litter
- Meat stock
- Chicks
- Live birds
- Chicken manure / compost

Grouped categories:

- Feed & Nutrition
- Health & Medicine
- Water & Utilities
- Housing & Materials
- Poultry Products
- By-products

Main files:

- `src/services/repositories/farmInventoryRepository.js`
- `src/hooks/useFarmInventory.js`
- `src/pages/FarmInventory.jsx`

### Sales integration

Sales now support:

- Eggs
- Meat
- Live birds
- Chicks
- Chicken manure / compost

Sales deduct inventory where applicable.

Main file:

- `src/pages/SalesLog.jsx`

## 8. Platform SaaS Features Added Recently

These are the most important recent changes:

### Separate platform dashboard

File:

- `src/pages/platform/PlatformDashboard.jsx`

Features:

- Farm tenant listing
- Tenant creation
- Subscription status control
- Usage overview
- Support impersonation

### Tenant-aware auth flow

Files:

- `src/services/auth/authService.ts`
- `src/context/AuthContext.jsx`

Features:

- Platform owner demo login
- Tenant-aware demo sessions
- Login redirect to platform or farm workspace

### Tenant-aware farm admin console

File:

- `src/pages/admin/UserManagement.jsx`

Features:

- User invites
- Role assignment
- Access revocation
- Custom roles
- Module permission editing

### Grouped navigation

File:

- `src/components/app/AppLayout.jsx`

Current nav groups:

- Farm Operations
- Health & Feed
- Inventory
- Finance
- People
- Administration

## 9. Data and Storage Model

### Supabase

There is an initial Supabase migration:

- `supabase/migrations/20260402_init.sql`

It defines core SaaS/farm tables such as:

- organizations
- memberships
- organization_settings
- flocks
- daily_logs
- vaccinations
- expenses
- sales
- employees

### Local demo mode

Legacy demo data still uses:

- localStorage
- seeded records
- tenant snapshots

Main file:

- `src/utils/storage.js`

Important warning:

This file still contains a lot of old global storage logic. The new platform repository works around this by swapping tenant snapshots into the legacy keys.

That means:

- Demo mode can simulate multi-tenancy
- But the real long-term direction should be moving more feature pages to proper repositories and tenant-aware backend storage

## 10. Important Files for a New Developer

If a new developer has little context, these are the best starting points:

### Start here

- `README.md`
- `TECHNICAL_HANDOFF.md`

### App shell and routing

- `src/App.jsx`
- `src/components/app/AppLayout.jsx`
- `src/components/app/ProtectedRoute.jsx`

### Access and tenancy

- `src/context/AuthContext.jsx`
- `src/context/TenantContext.jsx`
- `src/app/modules.jsx`
- `src/app/accessControl.js`
- `src/services/repositories/tenantRepository.ts`
- `src/services/repositories/platformRepository.js`

### Farm admin / SaaS admin

- `src/pages/platform/PlatformDashboard.jsx`
- `src/pages/admin/UserManagement.jsx`
- `src/pages/admin/SystemSettings.jsx`

### Inventory and sales

- `src/pages/FarmInventory.jsx`
- `src/pages/EggInventory.jsx`
- `src/pages/SalesLog.jsx`
- `src/pages/DailyLogForm.jsx`
- `src/services/repositories/farmInventoryRepository.js`
- `src/services/repositories/eggInventoryRepository.js`

### Legacy storage and technical debt

- `src/utils/storage.js`
- `src/services/repositories/legacyData.js`

## 11. Demo Accounts

### Platform owner

- `owner@clucktrack.com / owner123`

### Farm accounts

- `admin@farm.com / admin123`
- `manager@farm.com / manager123`
- `emp@farm.com / emp123`
- `acc@farm.com / acc123`

## 12. Local Development and Deployment

### Run locally with Vite

```bash
npm install
npm run dev
```

Default local URL:

- `http://localhost:5173`

### Docker

```bash
docker compose up --build
```

Current app URL:

- `http://localhost:8080`

Health endpoint:

- `http://localhost:8080/healthz`

## 13. Current Strengths

The project is in a good place for:

- Showing a SaaS direction to stakeholders
- Demoing multi-tenant behavior
- Demoing farm-specific admin and role controls
- Running locally and via Docker
- Continuing incremental migration from prototype to SaaS product

## 14. Known Gaps and Risks

These are the most important things a new developer should understand immediately:

### 1. Multi-tenancy is partly simulated in demo mode

The platform layer is real in the frontend, but tenant isolation for many business modules is still powered by legacy localStorage snapshot swapping.

### 2. Supabase migration is incomplete

The backend schema exists for core farm data, but platform-owner features, custom roles, subscriptions, impersonation, and tenant-scoped user admin are not fully modeled and persisted in Supabase yet.

### 3. Some pages still bypass repositories

Several pages and components still read localStorage directly instead of going through repositories. This makes long-term SaaS hardening more difficult.

### 4. Mixed old/new architecture

The codebase contains:

- newer SaaS shell code
- older prototype-style feature logic

This is workable, but a new developer should expect some inconsistency.

## 15. Recommended Next Steps

If development continues, the highest-value next steps are:

1. Move platform-owner entities into Supabase:
   - subscriptions
   - tenant metadata
   - role definitions
   - impersonation audit trail

2. Migrate remaining direct localStorage pages into repository-based access

3. Add tenant-aware backend persistence for:
   - farm inventory
   - egg inventory
   - tenant user admin
   - role definitions

4. Add tests around:
   - access control
   - impersonation
   - tenant switching
   - custom role updates

5. Add audit logging for platform actions and farm admin actions

## 16. Short Project Summary

If someone asks, "What is CluckTrack right now?", the best short answer is:

CluckTrack is a React/Vite poultry farm management app that has been upgraded from a single-farm demo into a SaaS-ready multi-tenant frontend foundation. It now includes a platform-owner admin dashboard, tenant-aware farm workspaces, farm-scoped role management, inventory and egg tracking, and Docker deployment. The app is functional and demoable, but some tenant data behavior is still powered by legacy localStorage and should be migrated further into repository-backed and Supabase-backed persistence over time.
