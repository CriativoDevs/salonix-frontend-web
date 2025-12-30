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
- Feedback visibility is owner-only on the frontend; backend may keep `feedback_enabled` for future use, but FE does not gate by it.

## Captcha Configuration
The application supports pluggable captcha providers via `src/components/security/CaptchaGate.jsx`.

### Environment Variables
Configure in `.env`:
- `VITE_CAPTCHA_PROVIDER`: `turnstile` (recommended), `hcaptcha`, or empty (dev fallback).
- `VITE_TURNSTILE_SITEKEY`: Your Cloudflare site key.
- `VITE_HCAPTCHA_SITEKEY`: Your hCaptcha site key.
- `VITE_CAPTCHA_BYPASS_TOKEN`: A secret string to bypass captcha in development/tests.

### Bypass for Development
To avoid captcha checks during local development or automated tests:
1. Set `VITE_CAPTCHA_BYPASS_TOKEN=my-secret-token` in `.env`.
2. Ensure the backend accepts this token (server-side validation).
3. The `CaptchaGate` component will not render the widget and will automatically pass the token.

### Fallback
If `VITE_CAPTCHA_PROVIDER` is not set or invalid, the component renders a simple "I'm not a robot" checkbox. **This is for UX simulation only and provides NO security.**

## Future Actions
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
- **CaptchaGate**: Proteção em Login, Registro e Reset de Senha.

### Dependências do Backend
- Rate limiting, captcha e RBAC serão entregues em **BE-212**.
- Feature flags de planos (push, relatórios) consumidos via `/api/tenant/meta`.
- Visibilidade do Feedback é apenas para owner no frontend; o backend pode manter `feedback_enabled` para uso futuro, mas o FE não faz gate por essa flag.

### Configuração de Captcha
O `CaptchaGate.jsx` suporta múltiplos provedores. Configure via `.env`:

- **Turnstile (Recomendado)**:
  ```env
  VITE_CAPTCHA_PROVIDER=turnstile
  VITE_TURNSTILE_SITEKEY=seu-site-key
  ```

- **hCaptcha**:
  ```env
  VITE_CAPTCHA_PROVIDER=hcaptcha
  VITE_HCAPTCHA_SITEKEY=seu-site-key
  ```

- **Bypass (Dev/Testes)**:
  Defina `VITE_CAPTCHA_BYPASS_TOKEN`. O componente não renderizará o widget e passará o token automaticamente.

- **Modo Fallback**:
  Se nenhum provider for definido, um checkbox simples será exibido para simular a UX. **Não oferece segurança real.**

### Ações Futuras
- Considerar armazenamento alternativo (cookies httpOnly) se o backend optar por mudanças.
- Auditar dependências (npm audit) a cada release.
- Documentar processos de suporte para reset de senha e exclusão de conta (GDPR).

> Atualize esta nota sempre que novas proteções ou riscos forem introduzidos.
