# 🔐 Security Notes — Frontend Web

## Language / Idiomas
- EN: English version first
- PT: Versão em Português abaixo

## Current Controls
- Session based on JWT access/refresh with automatic renewal (`src/api/client.js`).
- Tokens stored in `sessionStorage` (access) and `localStorage` (refresh) + cleared via `logout`.
- Authentication errors show `error_id` to facilitate support.
- 401 interception forces logout and storage cleanup.
- Manual lock: user can end session via UI (header/mobile).

## Backend Dependencies
- Rate limiting, captcha, and RBAC will be delivered in **BE-212**.
- Plan feature flags (push, reports) consumed via `/api/tenant/meta`.

## Future Actions
- Implement CAPTCHA and visual lockout (FEW-210).
- Consider alternative storage (httpOnly cookies) if backend opts for changes.
- Audit dependencies (npm audit) at each release.
- Document support processes for password reset and account deletion (GDPR).

> Update this note whenever new protections or risks are introduced.

---

## 🇵🇹 Notas de Segurança – Frontend Web

### Controles Vigentes
- Sessão baseada em JWT access/refresh com renovação automática (`src/api/client.js`).
- Tokens armazenados em `sessionStorage` (access) e `localStorage` (refresh) + limpados via `logout`.
- Erros de autenticação exibem `error_id` para facilitar suporte.
- Interceptação de 401 força logout e limpeza de storage.
- Bloqueio manual: usuário pode encerrar sessão via UI (header/mobile).

### Dependências do Backend
- Rate limiting, captcha e RBAC serão entregues em **BE-212**.
- Feature flags de planos (push, relatórios) consumidos via `/api/tenant/meta`.

### Ações Futuras
- Implementar CAPTCHA e lockout visual (FEW-210).
- Considerar armazenamento alternativo (cookies httpOnly) se o backend optar por mudanças.
- Auditar dependências (npm audit) a cada release.
- Documentar processos de suporte para reset de senha e exclusão de conta (GDPR).

> Atualize esta nota sempre que novas proteções ou riscos forem introduzidos.
