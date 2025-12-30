# 🛠️ Frontend Web Implementations

## Language / Idiomas
- EN: English version first
- PT: Versão em Português abaixo

## Authentication & Session (FEW-201)

- Context: Connect login/register to Django/DRF backend and drop mocks.
- Main components:
  - `src/api/client.js` — Axios with JWT refresh interceptor.
  - `src/contexts/AuthContext.jsx` — Global session state, structured errors, and logout.
  - `src/pages/Login.jsx` / `src/pages/Register.jsx` — Controlled forms, error popup with `X-Request-ID`.
  - `src/components/ui/ErrorPopup.jsx` / `src/utils/apiError.js` — Componentized error feedback.
- Adopted practices:
  - Tokens in memory + segregated storage (access in session, refresh in local).
  - Uniform error handling (`{ message, code, details, requestId }`).
  - Manual logout available across navigation (desktop/mobile).
- Recommended tests:
  - `npm run lint` (clean after `.vite` ignore).
  - Manual flow: register → login → navigate → logout.
- Attention points:
  - Future need to protect additional routes with roles (depends on BE-212).
  - `useAuth` hook exposes `clearAuthError` for controlled resets.

### Hardening (FEW-231)

- Context: Align with BE-212 to reduce abuse on public endpoints.
- Implementations:
  - `CaptchaGate` on Login/Register/Forgot with `turnstile`/`hcaptcha`/`builtin` modes and dev bypass (`VITE_CAPTCHA_BYPASS_TOKEN`).
  - Send captcha token in `X-Captcha-Token` header.
  - Handle 429 (Rate Limit) based on `Retry-After` header (friendly message).
- Env (FE):
  - `VITE_CAPTCHA_BYPASS_TOKEN` — token for dev
  - `VITE_CAPTCHA_PROVIDER` — `turnstile | hcaptcha | builtin`
  - `VITE_TURNSTILE_SITEKEY` / `VITE_HCAPTCHA_SITEKEY`

## Billing & Checkout (FEW-232 / FEW-320)

- **Context:**
  - Provides a flexible billing flow that supports both Mock (Development) and Real (Staging/Prod) environments.
  - Uses `VITE_BILLING_MOCK` to toggle between internal mock logic and Stripe integration.

- **Environment Variables:**
  - `VITE_BILLING_MOCK=true` (Default for dev): Enables internal simulation of plan upgrades and checkout.
  - `VITE_BILLING_MOCK=false`: Activates integration with real backend endpoints (`/api/payments/v2/checkout/`, `/api/payments/v2/portal/`).

- **Key Components:**
  - `src/pages/Plans.jsx`: Lists available plans. Uses `useBillingOverview` to fetch data.
  - `src/api/billing.js`: Abstraction layer.
    - If `VITE_BILLING_MOCK=true`: Returns mocked data and simulates success after a short delay.
    - If `VITE_BILLING_MOCK=false`: Calls backend APIs.
  - `src/pages/BillingSuccess.jsx` / `src/pages/BillingCancel.jsx`: Landing pages after Stripe redirection.

- **Recommended Workflow (QA/Dev):**
  1. **Development:** Keep `VITE_BILLING_MOCK=true` for rapid iteration of UI/UX without network calls.
  2. **Staging:** Set `VITE_BILLING_MOCK=false` and configure `STRIPE_PUBLISHABLE_KEY` (if needed for Elements) to test real checkout flows.

- **QA Scenarios:**
  - **Mock:** Verify modal opens, "Success" toast appears, and UI updates plan badge immediately.
  - **Real:** Verify redirection to Stripe Checkout, successful payment, redirection back to `/billing/success`, and eventual plan update via Webhook (async).

## How to Document Upcoming Features

1. Create a subsection with the issue identifier (e.g., `## Landing Page (FEW-207)`).
2. List context, touched files, UX/tech decisions, tests, and pending items.
3. Add product insights or cross-integrations (e.g., backend dependencies).

> Keeping this file updated makes it easier to review technical history without hunting old PRs.

## Institutional Landing Page (FEW-207)

- Context: Create a public presence for TimelyOne with authorized content in `docs/LANDING-CONTENT.md`.
- Main components:
  - `src/pages/Landing.jsx` — full page with hero, differentiators, plans, audiences, and CTA.
  - Update `src/routes/Router.jsx` to expose `/` route and direct unknowns.
- Characteristics:
  - Responsive layout with Tailwind, conversion-focused (CTAs "Register", "Sign in").
  - Plans section based on defined prices (Free Trial, Starter, Pro, White-label).
  - If an already authenticated user accesses `/`, redirect to `/dashboard`.
- Suggested next increments:
  - Add real language selector and integrate analytics.
  - Load content from JSON/Markdown file to ease updates without deploy.

## Theming & Feature Flags per Tenant (FEW-202)

- Context: Consume `/api/users/tenant/meta/` to identify tenant, expose feature flags, and fill frontend data without relying on mocks.
- New components:
  - `src/contexts/TenantContext.jsx` — Global provider resolving slug and loading meta/flags.
  - `src/hooks/useTenant.js` — Convenience hook to consume the context.
  - `src/api/tenant.js` — Axios client dedicated to meta endpoint.
  - `src/utils/tenant.js` — Helper to resolve slug (query, env, subdomain) and defaults.
- Main updates:
  - `App.jsx` wraps the app with `<TenantProvider>` (before `<AuthProvider>`).
  - `Settings.jsx` shows current plan, modules, and active channels, plus pre-fills business data.
  - Institutional branding kept in landing/login to avoid visual regressions.
- Added tests:
  - `src/utils/__tests__/tenant.test.js` covers slug resolution.
- Notes:
  - If the backend is unavailable, we fall back to `DEFAULT_TENANT_META` and the title resets to “TimelyOne”.
  - Natural next step: use the context to condition sections (e.g., hide premium modules).
  - Feedback availability: route and menu are always available to `owner`; the frontend does not consume any `feedback_enabled` flag from backend for gating.

## Settings / Branding (FEW-240)

- Status: in progress. "Branding" tab reads real tenant metadata and allows saving colors/logo. Preview normalizes relative paths (`/media/...`) and handles upload errors (2MB limit, invalid URL).
- Missing:
  - Backend does not yet remove the logo file when receiving empty `logo_url` (`BE-BUG` open). Front shows a warning and keeps default logo until fix.
  - Other tabs (General/Notifications/Business) still use placeholders and await dedicated endpoints.
- Notes:
  - Partial theme applied: navbar, main cards, and buttons use tenant palette; rest of layout remains default until redesign is complete.
  - Documentation/issue updated to track logo bug (FEW-BUG).

## Tenant Slug & Bootstrap (FEW-213/FEW-214)

- Context: With backend returning `tenant` block in auth flows and exposing `/api/users/me/tenant/`, FEW must ensure slug/meta are persisted immediately to apply branding without querystring dependence.
- Main components:
  - `src/contexts/AuthContext.jsx` now hydrates `TenantProvider` after login, refresh, or register (`fetchTenantBootstrap`) and exposes `tenant` in global context.
  - `src/contexts/TenantContext.jsx` gained `applyTenantBootstrap`, allowing meta preloaded before official fetch, and respecting slug from Auth.
  - `src/pages/Register.jsx` applies slug/meta returned by registration before redirecting to login.
- Decisions:
  - Bootstrap on refresh fetches `/users/me/tenant/` silently and passes meta to provider to avoid unbranded flashes.
  - On logout, slug returns to `DEFAULT_TENANT_META.slug`, keeping institutional login theme.
- Pending:
  - Adjust Landing/Login to apply theme even without authentication (when UX makes sense) and document smoke tests in FEW-215.
