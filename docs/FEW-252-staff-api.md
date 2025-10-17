# FEW-252 — Backend Staff API Reference

Companion notes for implementing the admin staff management flow in FEW.

## Endpoints

### `GET /api/users/staff/`
- **Auth**: JWT; only `owner` or `manager` of the tenant can call.
- **Response**: array of staff members serialized by `TenantStaffMemberSerializer`.

```jsonc
[
  {
    "id": 12,
    "role": "manager",          // enum: owner | manager | collaborator
    "status": "active",         // enum: invited | active | disabled
    "email": "user@example.com",
    "username": "user",
    "first_name": "Ana",
    "last_name": "Silva",
    "invited_at": "2025-09-12T12:34:56Z",
    "activated_at": "2025-09-13T09:00:00Z",
    "deactivated_at": null,
    "created_at": "...",
    "updated_at": "..."
  }
]
```

### `POST /api/users/staff/`
- **Auth**: owner or manager (only owner can create another manager).
- **Payload**:
  ```jsonc
  {
    "email": "team@example.com",
    "role": "collaborator", // default collaborador
    "first_name": "João",   // optional
    "last_name": "Santos"   // optional
  }
  ```
- **Uniqueness rules**:
  - Email is case-insensitive unique (backend normalises). If user exists on another tenant → 400.
  - If user exists without tenant, BE assigns it to current tenant.
- **Response**: staff data + invitation metadata.
  ```jsonc
  {
    "id": 13,
    "role": "collaborator",
    "status": "invited",
    "email": "team@example.com",
    "username": "team",
    "first_name": "João",
    "last_name": "Santos",
    "invited_at": "2025-09-14T10:00:00Z",
    "invite_token": "6Ot...zA",
    "invite_token_expires_at": "2025-09-21T10:00:00Z",
    "activated_at": null,
    "deactivated_at": null,
    "created_at": "...",
    "updated_at": "..."
  }
  ```
- **Errors**:
  - 400 `{"detail": "..."} or {"role": ["Apenas owner..."]}` for validation.
  - 403 when requester is collaborator.

### `PATCH /api/users/staff/`
- **Auth**: owner or manager (owner-only actions noted below).
- **Payload**:
  ```jsonc
  {
    "id": 13,
    "role": "collaborator",   // optional
    "status": "active"        // optional
  }
  ```
  - `role`: can change collaborator ↔ manager. Only owners can promote to `manager`.
  - `status`: `active` re-enables the user; `disabled` soft-disables.
  - You cannot update the owner (`400`).
- **Response**: updated staff member (same shape as serializer).

### `DELETE /api/users/staff/`
- **Auth**: owner or manager.
- **Payload**: `{ "id": 13 }`
- **Behaviour**: calls `mark_disabled()` (soft delete). Cannot disable owner.
- **Response**: `204 No Content`; errors (400/403) for invalid id/permissions.

### `POST /api/users/staff/accept/`
- **Auth**: none (public endpoint).
- **Payload**:
  ```jsonc
  {
    "token": "6Ot...zA",
    "password": "StrongPass!9",
    "first_name": "João", // optional
    "last_name": "Santos" // optional
  }
  ```
- **Rules**:
  - Token must exist, status must be `invited`, not expired.
  - Password minimum length 8; backend sets password & marks staff active.
- **Response**: staff serializer (no invite token).
- **Errors**: 400 for invalid/expired token, repeated attempts, weak password.

## Domain Rules Recap

- **Roles**: `owner` (unique per tenant), `manager`, `collaborator`. Stored in `TenantStaffMember.Role`.
- **Statuses**: `invited`, `active`, `disabled`. Stored in `TenantStaffMember.Status`.
- **Permissions**:
  - Only owner/manager can list/invite/update/delete staff.
  - Only owner can create managers or promote someone to manager.
  - Collaborators cannot access staff endpoints.
- **Responses**: All staff objects share serializer fields; timestamps are ISO 8601; empty fields return `null`.
- **Invite metadata**: Only present in POST response; not persisted once accepted (token cleared).
- **Accept flow**: After success, backend auto-creates/links a `Professional` record for collaborators.

## Frontend Considerations

- Use `X-Request-ID` from error responses for support messaging.
- Handle `403` (permission) and `400` (validation) distinctly; backend may send nested error objects.
- Rate limiting is not customised; treat `429` generically (show retry messaging).
- When toggling status/role, expect immediate updated staff payload; no background jobs.
