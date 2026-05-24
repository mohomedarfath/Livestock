# Security Audit Report (2026-04-16)

## Scope
- Dependency vulnerability scan attempt via `npm audit`.
- Manual source review for common client-side security risks in the current repository.

## Tooling result
- `npm audit --json` failed in this environment with `403 Forbidden` from `https://registry.npmjs.org/-/npm/v1/security/advisories/bulk`, so dependency CVEs could not be enumerated from npm advisories in this run.

## Findings

### 1) Plaintext credentials in legacy demo storage (High)
- Demo users are seeded with hard-coded plaintext passwords in browser `localStorage`.
- Affected code:
  - `src/utils/storage.js` (seeded users include `password` fields such as `admin123`, `manager123`, etc.)
  - `src/services/auth/authService.ts` (legacy login compares raw plaintext password values)
- Risk:
  - Any script execution in origin context (including XSS) can read/abuse these credentials.
  - Users may reuse similar credentials elsewhere.
  - No hashing/salting and no brute-force protection in demo path.

### 2) Legacy auth fallback enabled by env flag (Medium)
- The app can run in `legacy-demo` auth mode when `VITE_ENABLE_LEGACY_DEMO=true`.
- In that mode, authentication is entirely client-side and localStorage-backed.
- Risk:
  - Easy privilege/session tampering from browser devtools.
  - Should never be enabled in production deployments.

### 3) Extensive business data in localStorage (Medium)
- Multiple modules persist operational and user/session data in localStorage.
- Risk:
  - localStorage is readable by any JavaScript running in page context.
  - Increases blast radius if XSS occurs.

## Recommended remediations
1. **Disable/remove legacy-demo auth from production builds** and fail closed when Supabase config is missing.
2. **Remove plaintext passwords from seeded demo data**; if demo auth must remain temporarily, store only hashed placeholders and clearly isolate it to non-production environments.
3. **Migrate sensitive data off localStorage** (session and business records) to backend-controlled storage with proper auth checks.
4. Add CI security checks that do not depend on npm advisories alone (e.g., OWASP dependency-check, SCA in CI, Semgrep security rules).
5. Add a runtime guard that blocks startup if `VITE_ENABLE_LEGACY_DEMO=true` in production mode.

## Notes
- This report reflects repository state reviewed on 2026-04-16.
- Dependency CVE status remains incomplete until a successful advisory-backed scan can run.
