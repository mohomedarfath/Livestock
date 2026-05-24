# Server Access Risk Assessment Report (Defensive)

**Date:** 2026-04-16  
**Repository:** `/workspace/clucktrack`  
**Assessment type:** Defensive code/config review (no exploit development)

## Important safety note
This report intentionally avoids weaponized exploit instructions. It documents realistic attacker pathways at a high level and includes **safe validation checks** and remediations.

## Executive summary
Based on repository evidence, the most likely routes to attacker-controlled server/data access are:
1. Misconfiguration that enables legacy demo auth in production.
2. Client-side credential/data exposure through localStorage + potential XSS.
3. Missing hardening headers that reduce browser-side attack resistance.
4. Secrets hygiene and deployment controls (service role key handling not present in repo, but must be enforced operationally).

## Findings

### F-01 — Legacy demo auth can become an entry path if enabled outside dev (High)
**Evidence**
- App can run with `legacy-demo` fallback controlled by `VITE_ENABLE_LEGACY_DEMO`.
- Legacy mode validates credentials in the browser via plaintext comparison.
- Demo credentials are displayed in UI and seeded in storage.

**Why this can lead to server/data compromise**
- If deployed with legacy mode enabled, attacker can obtain predictable credentials and act as privileged demo users.
- If backend APIs trust frontend role/state assumptions, this can become a pivot into data-layer abuse.

**Safe PoC (validation only)**
1. In a non-production environment, set `VITE_ENABLE_LEGACY_DEMO=true`.
2. Confirm login succeeds with demo credentials shown by UI.
3. Verify whether privileged screens/actions become available without Supabase-backed identity.
4. Confirm backend rejects any privileged writes from non-authenticated sessions.

**Remediation**
- Hard-block startup when `VITE_ENABLE_LEGACY_DEMO=true` in production builds.
- Remove legacy login path from production bundles.
- Remove demo credentials from UI and seeded data.

---

### F-02 — Plaintext credentials and broad localStorage usage increase account/session theft risk (High)
**Evidence**
- Seeded users include plaintext passwords.
- App stores extensive operational data and session-adjacent data in localStorage.
- Project README acknowledges ongoing migration away from prototype localStorage model.

**Why this can lead to server/data compromise**
- Any client-side script execution vulnerability (XSS or malicious extension) can exfiltrate credentials/session context.
- Stolen credentials may be reused against real systems by users.

**Safe PoC (validation only)**
1. Authenticate to a test account in dev.
2. Use browser devtools Application tab to inspect localStorage keys.
3. Confirm sensitive/high-value data is visible in clear text.
4. Validate whether tampering localStorage values changes effective permissions/UI state.

**Remediation**
- Never store passwords in localStorage.
- Move authoritative data/session state server-side.
- Minimize localStorage to low-risk preferences.
- Add strict output encoding and input sanitization strategy to reduce XSS risk.

---

### F-03 — Missing defensive security headers reduce exploit resistance (Medium)
**Evidence**
- Current `nginx.conf` defines cache/route behavior but does not set CSP, X-Frame-Options, HSTS, X-Content-Type-Options, Referrer-Policy, or Permissions-Policy.

**Why this can lead to server/data compromise**
- Missing CSP/XFO/other policies increase likelihood and impact of browser-based compromise, which can expose tokens, credentials, and sensitive business data.

**Safe PoC (validation only)**
1. Deploy to staging with current nginx config.
2. Run `curl -I <app-url>` and verify absence of listed headers.
3. Add headers at proxy and re-run to verify enforcement.

**Remediation**
- Configure security headers in nginx (or edge CDN/WAF) and test in CI.
- Start with strict defaults and relax only where required.

---

### F-04 — Supabase/RLS design appears present, but operational controls determine real server-access risk (Medium)
**Evidence**
- Supabase migration enables RLS across key tables and membership-based policies.
- Multi-tenant access relies on authenticated user membership checks.

**Why this can still lead to compromise if misconfigured**
- Leaked service-role keys or misconfigured anonymous policies bypass frontend expectations.
- Operational environment (keys, dashboard settings, CI secrets) is outside repo and remains a critical risk area.

**Safe PoC (validation only)**
1. In staging, test that a user from Org A cannot read/write Org B data.
2. Verify anonymous role cannot call privileged tables/functions.
3. Verify service-role key is never exposed to frontend bundle or client logs.

**Remediation**
- Enforce secret scanning in CI.
- Rotate keys and use least privilege.
- Add integration tests for cross-tenant isolation and RLS policy assertions.

## Prioritized remediation plan
1. **Immediate (P0):** Disable legacy-demo auth in production and remove plaintext demo credentials.
2. **Immediate (P0):** Move session/credential logic off localStorage; treat browser state as untrusted.
3. **Near-term (P1):** Add and validate strict security headers in nginx/edge.
4. **Near-term (P1):** Add automated security tests: SAST, secret scanning, dependency scanning, RLS integration checks.
5. **Ongoing (P2):** Complete migration from legacy localStorage prototype to repository/backend-authoritative model.

## Files reviewed
- `src/services/auth/authService.ts`
- `src/utils/storage.js`
- `src/pages/LoginPage.jsx`
- `src/lib/env.ts`
- `nginx.conf`
- `supabase/migrations/20260402_init.sql`
- `README.md`
