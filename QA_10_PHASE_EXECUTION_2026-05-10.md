# LivestockTrack QA: 10-Phase Execution Plan

Date: 2026-05-10  
Target: Local demo app at `http://127.0.0.1:5177`  
Source Matrix: `QA_REPORT_2026-05-10.md` with 360 QA cases

## Phase Breakdown

| Phase | Name | Planned Cases | Focus | Status |
|---:|---|---:|---|---|
| 1 | Foundation, Auth, Session | 36 | Local environment, build/test health, demo auth, protected-route entry, session switching | Completed |
| 2 | App Shell, Navigation, Responsive | 36 | Sidebar/header, grouped nav, command palette, theme/currency, desktop/tablet/mobile shell | Completed |
| 3 | Roles, Tenant, Access Control | 36 | Admin/manager/employee/accountant/platform owner permissions and direct route guards | Not Started |
| 4 | Dashboard, Charts, Smart Suggestions | 36 | Dashboard widgets, quick actions, chart rendering, animal-specific dashboard copy | Not Started |
| 5 | Poultry Core Workflows | 36 | Flocks, daily logs, vaccinations, medicine, feed, FCR, incubation | Not Started |
| 6 | Cow Core Workflows | 42 | Cow dashboard, profiles, milk log, passbook, breeding, health, profitability | Not Started |
| 7 | Inventory And Sales | 42 | Poultry/cow inventory, stock movements, filters, activity, sales integration | Not Started |
| 8 | Finance | 36 | Expenses, budgets, wages, profit/loss, milk passbook finance coverage | Not Started |
| 9 | People, Admin, Platform | 36 | Employees, activities, admin console, settings, platform tenant flows | Not Started |
| 10 | Labs, PWA, Accessibility, Final Regression | 24 | Compliance, WhatsApp, vet notes, pasture, resources, PWA/offline, accessibility, final signoff | Not Started |
|  | Total | 360 |  |  |

## Phase 1 Scope

Phase 1 verifies the test foundation before deeper feature testing:

- Local dev server availability.
- `npm run lint`, `npm run test`, and `npm run build`.
- Anonymous protected-route redirect.
- Demo account login for Admin, Manager, Employee, Accountant, and Platform Owner.
- Sign-out/session switching between personas.
- Authenticated protected subroute direct navigation/reload behavior.

## Phase 1 Results Summary

| Status | Count |
|---|---:|
| Pass | 9 |
| Fail | 1 |
| Warn | 2 |
| Blocked | 0 |

Phase 1 result: **Pass with known defects/warnings**.

The app is ready for Phase 2, but the protected subroute redirect defect should remain high priority because it affects refresh/bookmark/deep-link behavior across later phases.

## Phase 1 Executed Checks

| ID | Check | Status | Evidence |
|---|---|---|---|
| P1-001 | Dev server is available | Pass | Existing Vite server listening on `127.0.0.1:5177`. |
| P1-002 | `npm run lint` | Warn | Command exited 0. One existing warning remains in `src/animal/AnimalTypeContext.jsx` for `react-refresh/only-export-components`. |
| P1-003 | `npm run test` | Pass | Vitest exited 0. 3 test files passed, 8 tests passed. |
| P1-004 | `npm run build` | Warn | Vite build exited 0. PWA assets generated. Existing large chunk warning remains for Firebase/charts bundles. |
| P1-005 | Anonymous `/app` access redirects to auth | Pass | Opening `/app` without a session landed on `http://127.0.0.1:5177/auth` and showed sign-in UI. |
| P1-006 | Admin demo sign-in | Pass | `admin@farm.com / admin123` reached `/app` and displayed `Admin User`. |
| P1-007 | Manager demo sign-in | Pass | `manager@farm.com / manager123` reached `/app` and displayed `Farm Manager`. |
| P1-008 | Employee demo sign-in | Pass | `emp@farm.com / emp123` reached `/app` and displayed `John Worker`. |
| P1-009 | Accountant demo sign-in | Pass | `acc@farm.com / acc123` reached `/app` and displayed `Accountant User`. |
| P1-010 | Platform owner demo sign-in | Pass | `owner@clucktrack.com / owner123` reached `/platform` and displayed platform console content. |
| P1-011 | Sign-out/session switching | Pass | Sign-out between demo personas allowed clean login as the next persona without stale identity evidence. |
| P1-012 | Authenticated `/app/inventory` direct navigation/reload | Fail | After admin sign-in, opening `/app/inventory` landed on `/app`; inventory route was not preserved. |

## Phase 1 Defects And Warnings

| ID | Severity | Type | Summary | Recommendation |
|---|---|---|---|---|
| DEF-P1-001 | High | Functional | Authenticated subroute direct navigation/reload redirects to `/app` instead of preserving `/app/inventory`. | Delay module access redirect until tenant/access state is fully resolved; add automated regression for deep links. |
| WARN-P1-001 | Low | Tooling | Lint has one Fast Refresh warning in `AnimalTypeContext.jsx`. | Move non-component exports to a separate module or document/suppress intentionally. |
| WARN-P1-002 | Low | Performance | Build has large chunk warnings for Firebase/charts. | Split heavy dependencies with dynamic imports/manual chunks or define an accepted bundle budget. |

## Phase 1 Rerun: 2026-05-10 21:19

| Check | Status | Evidence |
|---|---|---|
| `npm run lint` | Warn | Exited 0 with the same `react-refresh/only-export-components` warning in `src/animal/AnimalTypeContext.jsx`. |
| `npm run test` | Pass | Exited 0. 3 files passed, 8 tests passed. |
| `npm run build` | Warn | Exited 0. PWA assets generated; large chunk warning remains for Firebase/charts bundles. |
| Anonymous `/app` redirect | Pass | Opened `/app` with no active session and landed on `/auth`. |
| Admin demo login | Pass | `admin@farm.com / admin123` reached `/app` and displayed `Admin User`. |
| Manager demo login | Pass | `manager@farm.com / manager123` reached `/app` and displayed `Farm Manager`. |
| Employee demo login | Pass | `emp@farm.com / emp123` reached `/app` and displayed `John Worker`. |
| Accountant demo login | Pass | `acc@farm.com / acc123` reached `/app` and displayed `Accountant User`. |
| Platform owner demo login | Pass | `owner@clucktrack.com / owner123` reached `/platform` and displayed platform content. |
| Session switching | Pass | Sign-out between persona checks allowed clean next-persona login. |
| Authenticated `/app/inventory` direct navigation/reload | Fail | After admin login, opening `/app/inventory` resolved to `/app`; inventory route was not preserved. |

## Phase 2 Scope

Phase 2 verifies app-shell and navigation behavior:

- Sidebar brand, top-level nav, local demo status, and skip link.
- Animal selector persistence and shell icon changes.
- Grouped navigation accordions.
- Nav click behavior, breadcrumbs, page titles, and active route.
- Command palette/search button.
- Theme and currency menus.
- Unknown route redirect behavior.
- Direct navigation preservation for shell routes.
- Tablet/mobile/responsive checks where tooling allows.

## Phase 2 Results Summary

| Status | Count |
|---|---:|
| Pass | 18 |
| Fail | 2 |
| Not Run | 4 |
| Blocked | 0 |

Phase 2 result: **Pass with known routing defect and deferred viewport checks**.

## Phase 2 Executed Checks

| ID | Check | Status | Evidence |
|---|---|---|---|
| P2-001 | Sidebar brand and app name render | Pass | `Legacy Demo Farm` and `LivestockTrack` visible in the app shell. |
| P2-002 | Local demo status visible | Pass | Header/sidebar displayed `Local demo`. |
| P2-003 | Animal selector visible | Pass | Animal selector rendered with `All Animals` option. |
| P2-004 | Top-level nav renders | Pass | Dashboard and Settings links visible. |
| P2-005 | Skip link present | Pass | `Skip to main content` link present in DOM. |
| P2-006 | Cow selector changes shell icon | Pass | Selecting Cow showed Cow as selected and switched shell icon to cow. |
| P2-007 | Poultry selector restores shell icon | Pass | Selecting Poultry showed Poultry as selected and restored poultry icon. |
| P2-008 | Farm Operations accordion expands | Pass | Accordion opened and displayed poultry operation links such as Flocks and Daily Log. |
| P2-009 | Inventory accordion expands | Pass | Accordion opened and displayed Farm Inventory. `Energy & Water` is phase-2 gated and not expected in current phase-1 module visibility. |
| P2-010 | Finance accordion expands | Pass | Accordion opened and displayed finance links such as Expenses, Budget Planning, and Profit & Loss. |
| P2-011 | Farm Inventory nav click opens page | Pass | Clicking Farm Inventory opened `/app/inventory`. |
| P2-012 | Inventory breadcrumb is correct | Pass | Breadcrumb displayed `Inventory / Farm Inventory`. |
| P2-013 | Settings nav click opens page | Pass | Clicking Settings opened `/app/settings` and displayed System Settings. |
| P2-014 | Dashboard nav returns home | Pass | Clicking Dashboard returned to `/app`. |
| P2-015 | Header search/command button opens | Pass | `Search pages Ctrl K` opened the page search/command overlay. |
| P2-016 | Theme menu opens | Pass | Theme menu opened and displayed theme choices. |
| P2-017 | Currency menu opens | Pass | Currency menu opened and displayed currency choices. |
| P2-018 | Unknown route redirects safely | Pass | Opening an unknown route redirected back to safe app path. |
| P2-019 | Direct `/app/settings` navigation preserves page | Fail | Direct navigation to `/app/settings` landed on `/app` instead of System Settings. |
| P2-020 | Direct `/app/inventory` navigation preserves page | Fail | Direct navigation to `/app/inventory` landed on `/app` instead of Farm Inventory. |
| P2-021 | Tablet viewport app-shell pass | Not Run | Current in-app browser tooling did not expose reliable viewport resizing. |
| P2-022 | Mobile viewport app-shell pass | Not Run | Current in-app browser tooling did not expose reliable viewport resizing. |
| P2-023 | Mobile sidebar overlay and bottom nav | Not Run | Requires mobile viewport execution. |
| P2-024 | Visual overlap screenshot sweep | Not Run | Deferred to viewport-capable browser tooling. |

## Phase 2 Defects And Warnings

| ID | Severity | Type | Summary | Recommendation |
|---|---|---|---|---|
| DEF-P2-001 | High | Functional | Direct navigation to authenticated shell subroutes redirects to `/app`. Confirmed for `/app/settings` and `/app/inventory`. | Fix route/access initialization so authenticated deep links wait for tenant/access state before redirecting. |
| WARN-P2-001 | Medium | QA Coverage | Tablet/mobile app-shell checks could not be executed with current browser viewport controls. | Add Playwright or another viewport-capable test runner for responsive QA phases. |

## Next Phase

Phase 3 should test role, tenant, and access control in depth: module visibility by persona, direct route guards, platform-owner behavior, forbidden-route redirects, and role-sensitive quick actions.
