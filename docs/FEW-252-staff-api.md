# FEW-252 — Backend Staff API Reference

## Language / Idiomas
- EN: English version first
- PT: Versão em Português abaixo

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

---

## 🇵🇹 FEW-252 — Referência da API de Equipe (Backend)

Notas de apoio para implementar o fluxo de gestão de equipe no Admin (FEW).

### Endpoints

#### `GET /api/users/staff/`
- **Auth**: JWT; apenas `owner` ou `manager` do tenant podem chamar.
- **Resposta**: array de membros da equipe serializados por `TenantStaffMemberSerializer`.

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

#### `POST /api/users/staff/`
- **Auth**: owner ou manager (apenas owner cria outro manager).
- **Payload**:
```jsonc
{
  "email": "team@example.com",
  "role": "collaborator", // padrão colaborador
  "first_name": "João",   // opcional
  "last_name": "Santos"   // opcional
}
```
- **Regras de unicidade**:
  - Email único case-insensitive (backend normaliza). Se usuário existir em outro tenant → 400.
  - Se usuário existir sem tenant, BE associa ao tenant atual.
- **Resposta**: dados do staff + metadados de convite.
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
- **Erros**:
  - 400 `{ "detail": "..." }` ou `{ "role": ["Apenas owner..."] }` para validação.
  - 403 quando solicitante é colaborador.

#### `PATCH /api/users/staff/`
- **Auth**: owner ou manager (ações exclusivas do owner anotadas abaixo).
- **Payload**:
```jsonc
{
  "id": 13,
  "role": "collaborator",   // opcional
  "status": "active"        // opcional
}
```
  - `role`: pode alterar collaborator ↔ manager. Apenas owners podem promover a `manager`.
  - `status`: `active` reativa; `disabled` desativa (soft).
  - Não é possível atualizar o owner (`400`).
- **Resposta**: membro atualizado (mesmo formato do serializer).

#### `DELETE /api/users/staff/`
- **Auth**: owner ou manager.
- **Payload**: `{ "id": 13 }`
- **Comportamento**: chama `mark_disabled()` (soft delete). Não pode desativar owner.
- **Resposta**: `204 No Content`; erros (400/403) para id/permissões inválidas.

#### `POST /api/users/staff/accept/`
- **Auth**: nenhum (endpoint público).
- **Payload**:
```jsonc
{
  "token": "6Ot...zA",
  "password": "StrongPass!9",
  "first_name": "João", // opcional
  "last_name": "Santos" // opcional
}
```
- **Regras**:
  - Token deve existir, status `invited`, não expirado.
  - Senha mínima de 8; backend define senha e marca staff como ativo.
- **Resposta**: serializer do staff (sem token de convite).
- **Erros**: 400 para token inválido/expirado, tentativas repetidas, senha fraca.

### Resumo de Regras de Domínio

- **Papéis**: `owner` (único por tenant), `manager`, `collaborator`. Armazenados em `TenantStaffMember.Role`.
- **Status**: `invited`, `active`, `disabled`. Armazenados em `TenantStaffMember.Status`.
- **Permissões**:
  - Apenas owner/manager listam/convidam/atualizam/excluem staff.
  - Apenas owner cria managers ou promove alguém a manager.
  - Colaboradores não acessam endpoints de staff.
- **Respostas**: Todos os objetos compartilham campos do serializer; timestamps ISO 8601; campos vazios retornam `null`.
- **Metadados de convite**: Apenas no response do POST; não persistem após aceite (token limpo).
- **Fluxo de aceite**: Após sucesso, backend cria/associa um registro `Professional` para colaboradores.

### Considerações de Frontend

- Use `X-Request-ID` nas respostas de erro para mensagens de suporte.
- Trate `403` (permissão) e `400` (validação) de forma distinta; o backend pode enviar objetos de erro aninhados.
- Rate limiting não é customizado; trate `429` genericamente (mensagem de tentativa/espera).
- Ao alternar status/papel, espere payload de staff atualizado imediatamente; sem jobs em background.
