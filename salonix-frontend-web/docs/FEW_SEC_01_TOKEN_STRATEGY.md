# FEW-SEC-01: Token Storage Hardening Strategy

## Scope
Frontend web only (including PWA runtime in browser context).

## Problem
Today, sensitive tokens are persisted in localStorage/sessionStorage in ways that increase XSS impact.

## Goal
Reduce token exposure while preserving good login UX.

## Target Model

### Staff area (owner/manager/staff)
- Access token:
  - Storage: sessionStorage + in-memory cache
  - Purpose: short-lived API access
- Refresh token:
  - Storage: localStorage (temporary persistence)
  - Rules: local max age + rotation on refresh

### Client area
- Access token:
  - Storage: sessionStorage + in-memory cache
  - Purpose: short-lived API access
- Refresh token:
  - Storage: localStorage (temporary persistence)
  - Rules: local max age + rotation on refresh

## Mandatory Rules
1. Access tokens must not be kept in localStorage.
2. Refresh tokens must use max-age validation on read.
3. Refresh rotation must replace stored refresh token as soon as backend returns a new one.
4. Logout and refresh failure must clear all related tokens.
5. Context switch (staff <-> client) must clear opposite-context tokens.
6. Multi-tab sync must propagate logout/clear events.

## Login UX Impact

### Web (browser tab)
- User does NOT need to login every page reload.
- If refresh token is still valid, session is restored silently.
- User needs login again only when:
  - refresh token expires,
  - refresh token is invalid/revoked,
  - explicit logout,
  - storage cleared by browser/user.

### PWA (installed web app)
- Same behavior as Web because storage model is still browser-based.
- Reopen app:
  - silent restore if refresh is valid,
  - login screen if refresh is expired/invalid/cleared.

### Native app
- Out of scope for FEW-SEC-01.
- Native app should use secure OS storage (Keychain/Keystore) and has independent auth lifecycle.

## Security vs UX Decision
This model avoids forcing login on every open while reducing long-lived token exposure.

## Test Scenarios (minimum)
1. Reopen browser with valid refresh: session restored.
2. Reopen browser with expired refresh: login required.
3. Refresh 401/403: all tokens cleared and logout triggered.
4. Logout in one tab: other tabs receive logout sync.
5. Staff login then client login: old context tokens are cleared.

## Files expected to be touched in implementation
- src/utils/authStorage.js
- src/utils/clientAuthStorage.js
- src/api/client.js
- src/contexts/AuthContext.jsx
- src/contexts/ClientAuthContext.jsx
