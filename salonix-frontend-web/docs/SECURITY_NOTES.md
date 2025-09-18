# 🔐 Notas de Segurança – Frontend Web

## Controles Vigentes
- Sessão baseada em JWT access/refresh com renovação automática (`src/api/client.js`).
- Tokens armazenados em `sessionStorage` (access) e `localStorage` (refresh) + limpados via `logout`.
- Erros de autenticação exibem `error_id` para facilitar suporte.
- Interceptação de 401 força logout e limpeza de storage.
- Bloqueio manual: usuário pode encerrar sessão via UI (header/mobile).

## Dependências do Backend
- Rate limiting, captcha e RBAC serão entregues em **BE-212**.
- Feature flags de planos (push, relatórios) consumidos via `/api/tenant/meta`.

## Ações Futuras
- Implementar CAPTCHA e lockout visual (FEW-210).
- Considerar armazenamento alternativo (cookies httpOnly) se o backend optar por mudanças.
- Auditar dependências (npm audit) a cada release.
- Documentar processos de suporte para reset de senha e exclusão de conta (GDPR).

> Atualize esta nota sempre que novas proteções ou riscos forem introduzidos.
