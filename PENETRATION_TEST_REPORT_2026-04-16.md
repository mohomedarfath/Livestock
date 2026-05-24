# Penetration Test Report — CluckTrack

**Date:** 2026-04-16  
**Target:** Local repository build (`/workspace/clucktrack`)  
**Tester:** Codex agent (automated + manual review)

## 1) Scope & methodology

This was a **grey-box web application pentest** focused on:
- Build-time and source-level security review.
- Runtime HTTP surface checks on local preview instance.
- Client-side auth/session/data handling risks.

Out of scope:
- Live Supabase tenant testing (no target creds provided).
- External infrastructure/network perimeter testing.

## 2) Commands executed

1. `npm run build`
2. `npm run lint`
3. `npm test`
4. `npm run preview -- --host 127.0.0.1 --port 4173`
5. `curl -I http://127.0.0.1:4173/`
6. `curl -s -D - http://127.0.0.1:4173/ -o /dev/null | rg -n "Content-Security-Policy|X-Frame-Options|Strict-Transport-Security|Referrer-Policy|X-Content-Type-Options|Permissions-Policy|Set-Cookie|Access-Control-Allow-Origin|Server"`
7. `rg -n "your-anon-key|VITE_SUPABASE|enableLegacyDemo|legacy-demo|admin123|manager123|emp123|acc123" dist src`

## 3) Executive summary

**Risk rating: High (client-side compromise impact is high in demo/legacy mode).**

Key findings:
- **High:** Hard-coded plaintext demo credentials are present and bundled into production artifacts when legacy data paths are included.
- **High:** Legacy auth performs plaintext password matching in client-side logic.
- **Medium:** Security response headers (CSP, X-Frame-Options, X-Content-Type-Options, etc.) are not present on preview responses.
- **Medium:** Large amount of business and session-adjacent data is stored in browser `localStorage`.
- **Low/Info:** Dependency CVE enumeration via npm advisory endpoint remains blocked by environment policy (403 in prior attempt).

## 4) Detailed findings

### PT-01: Plaintext seeded credentials in client code (High)
**Evidence**
- Seeded demo users include plaintext passwords (`admin123`, `manager123`, etc.).
- Same values are visible in login page demo hints.

**Impact**
- Any XSS or browser compromise can read credentials immediately.
- Credentials are predictable and susceptible to abuse in shared/demo environments.

**Affected locations**
- `src/utils/storage.js`
- `src/pages/LoginPage.jsx`
- Bundled artifact also contains the seeded values under `dist/assets/*.js`.

**Recommendation**
- Remove plaintext passwords entirely from seeded data.
- If demo auth is required, use one-time tokens or non-authentic stubs not reusable as credentials.

---

### PT-02: Client-side legacy auth with plaintext comparison (High)
**Evidence**
- Auth service compares user-provided password directly to stored plaintext value in legacy mode.

**Impact**
- No server-side verification, no hashing, easy tampering with devtools/localStorage.
- Bypass potential in misconfigured deployments where legacy mode is enabled.

**Affected location**
- `src/services/auth/authService.ts`

**Recommendation**
- Disable legacy auth outside local development.
- Fail startup in production if `VITE_ENABLE_LEGACY_DEMO=true`.

---

### PT-03: Missing common defensive HTTP headers on app responses (Medium)
**Evidence**
- Header probe on `GET /` did not return CSP, X-Frame-Options, HSTS, Referrer-Policy, X-Content-Type-Options, or Permissions-Policy.

**Impact**
- Weaker browser-side protections against clickjacking, MIME sniffing, policy bypasses, and script injection blast radius.

**Affected location**
- Runtime response behavior (preview server and likely reverse-proxy config should be reviewed).

**Recommendation**
- Set headers at edge/proxy (e.g., nginx) and verify with integration tests.

---

### PT-04: Extensive `localStorage` persistence for operational data (Medium)
**Evidence**
- The app stores users/session and multiple domain datasets in localStorage; README also flags ongoing migration from prototype local storage.

**Impact**
- Increases exposure to XSS-based data exfiltration and client-side tampering.

**Affected locations**
- `src/utils/storage.js`
- `README.md`

**Recommendation**
- Move sensitive/authoritative records to backend storage with row-level access control.
- Keep localStorage only for low-risk UI preferences.

## 5) Reproducibility notes

- All findings are reproducible in this repository state on 2026-04-16.
- Runtime probing was performed against a local `vite preview` instance only.

## 6) Remediation priority

1. **Immediate:** Remove/disable legacy demo auth in production paths.
2. **Immediate:** Eliminate plaintext credentials from code and UI hints.
3. **Near-term:** Add strict security headers at reverse-proxy layer.
4. **Near-term:** Reduce localStorage usage for sensitive data.
5. **Ongoing:** Add CI security gates (SAST + dependency + secret scanning).
