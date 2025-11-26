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

## Plans Wizard / Checkout (FEW-208)

- Context: prepare UI for plan wizard and checkout integration, with mock mode support while billing backend (BE-210) is unavailable.
- Components:
  - `src/pages/Plans.jsx` — plan selection (basic/standard/pro) and checkout button.
  - `src/api/billing.js` — `createCheckoutSession(plan)` calls `payments/checkout/session/` or simulates when `VITE_BILLING_MOCK=true`.
  - Protected route `/plans` added in `Router.jsx`.
- Notes:
  - In dev, set `VITE_BILLING_MOCK=true` to simulate redirect (`/checkout/mock?plan=...`).
  - In production, the API should return `{ checkout_url }`.

## Créditos — Checkout Stripe (FEW-265)

- Context: Compra avulsa de créditos via Checkout hospedado (sem `publishable key` no FE).
- Components:
  - `src/pages/Settings.jsx` — modal “Adicionar créditos” chama `createCreditCheckoutSession` e redireciona para `checkout_url`.
  - `src/api/credits.js` — `createCreditCheckoutSession(amountEur)` e `fetchCreditPackages()`.
- Behaviour:
  - Após sucesso, webhook aplica créditos (`metadata.type=credit_purchase`) e saldo atualiza ao retornar para o `success_url`.
- Notes:
  - Removido fallback dev de compra direta; sempre via Checkout.

## Team Management (FEW-252)

- Context: enable owners and managers to invite, promote, and disable team members directly in Admin panel, with public invite acceptance flow.
- Main components:
  - `src/pages/Team.jsx` — filters, buttons, and integration with `useStaff` hooks to invite/update members.
  - `src/components/team/InviteStaffModal.jsx` and `ManageStaffModal.jsx` — modals with validation, `X-Request-ID` feedback, and permission-based blocks.
  - `src/components/ui/Modal.jsx` — reusable base layer for accessible modals (escape, basic focus trap).
  - `src/pages/StaffInviteAccept.jsx` — public page that receives `token` in URL, collects password, and confirms invite.
- Relevant behaviors:
  - Only owner can invite or promote someone to manager; managers create collaborators.
  - All actions show confirmations and keep loading state to avoid duplicate clicks.
  - Successful invites return token + expiration for manual sharing when needed.
  - Acceptance page requires password ≥ 8 characters, allows adjusting first/last name, and redirects to login after success (with countdown).
- Added tests:
  - `src/components/team/__tests__/InviteStaffModal.test.jsx`
  - `src/components/team/__tests__/ManageStaffModal.test.jsx`
  - `src/pages/__tests__/Team.test.jsx`
  - `src/pages/__tests__/StaffInviteAccept.test.jsx`
- Notes:
  - Resend invite/history flow depends on additional endpoints (planned in FEW-301).
  - QA must validate real tokens in staging once backend releases dedicated seed.

---

## 🇵🇹 Implementações do Frontend Web

### Autenticação e Sessão (FEW-201)

- **Contexto**: Conectar login/register ao backend Django/DRF e abandonar mocks.
- **Principais componentes**:
  - `src/api/client.js` – Axios com interceptor de refresh JWT.
  - `src/contexts/AuthContext.jsx` – Estado global de sessão, erros estruturados e logout.
  - `src/pages/Login.jsx` / `src/pages/Register.jsx` – Formulários controlados, popup de erro com `X-Request-ID`.
  - `src/components/ui/ErrorPopup.jsx` / `src/utils/apiError.js` – Componentização do feedback de erro.
- **Boas práticas adotadas**:
  - Tokens em memória + storage segregado (access em session, refresh em local).
  - Erros tratados de forma uniforme (`{ message, code, details, requestId }`).
  - Logout manual disponível em todas as navegações (desktop/mobile).
- **Testes recomendados**:
  - `npm run lint` (passa limpo após ignore de `.vite`).
  - Fluxo manual: registrar → login → navegar → logout.
- **Pontos de atenção**:
  - Necessidade futura de proteger rotas adicionais com roles (depende do BE-212).
  - Hook `useAuth` expõe `clearAuthError` para resets controlados.

#### Hardening (FEW-231)

- **Contexto**: Alinhar com o BE-212 para reduzir abuso nos endpoints públicos.
- **Implementações**:
  - `CaptchaGate` em Login/Registro/Forgot com modos `turnstile`/`hcaptcha`/`builtin` e bypass em dev (`VITE_CAPTCHA_BYPASS_TOKEN`).
  - Envio do token de captcha no header `X-Captcha-Token`.
  - Tratamento de 429 (Rate Limit) baseado no header `Retry-After` (mensagem amigável).
- **Env (FE)**:
  - `VITE_CAPTCHA_BYPASS_TOKEN` – token para dev
  - `VITE_CAPTCHA_PROVIDER` – `turnstile | hcaptcha | builtin`
  - `VITE_TURNSTILE_SITEKEY` / `VITE_HCAPTCHA_SITEKEY`

### Como documentar próximas features

1. Crie uma subseção com identificador da issue (ex: `## Landing Page (FEW-207)`).
2. Liste contexto, arquivos tocados, decisões de UX/tecnologia, testes e pendências.
3. Adicione insights para o produto ou integrações cruzadas (ex.: dependências do backend).

> Manter este arquivo atualizado facilita revisar o histórico técnico sem caçar PRs antigas.

### Landing page institucional (FEW-207)

- **Contexto**: Criar presença pública para TimelyOne com conteúdo autorizado em `docs/LANDING-CONTENT.md`.
- **Principais componentes**:
  - `src/pages/Landing.jsx` – página completa com hero, diferenciais, planos, audiências e CTA.
  - Atualização de `src/routes/Router.jsx` para expor rota `/` e direcionar desconhecidos.
- **Características**:
  - Layout responsivo com Tailwind, foco em conversão (CTA "Registar", "Entrar").
  - Secção de planos baseada nos preços definidos (Free Trial, Starter, Pro, White-label).
  - Se utilizador já autenticado aceder `/`, redireciona para `/dashboard`.
- **Próximos incrementos sugeridos**:
  - Adicionar seletor de idioma real e integrar analytics.
  - Carregar conteúdo de ficheiro JSON/Markdown para facilitar atualizações sem deploy.

### Theming e Feature Flags por Tenant (FEW-202)

- **Contexto**: Consumir `/api/users/tenant/meta/` para identificar tenant, expor feature flags e preencher dados no front sem depender de mocks.
- **Componentes novos**:
  - `src/contexts/TenantContext.jsx` – Provider global com resolução de slug e carregamento de meta/flags.
  - `src/hooks/useTenant.js` – Hook de conveniência para consumir o contexto.
  - `src/api/tenant.js` – Cliente Axios dedicado ao endpoint de meta.
  - `src/utils/tenant.js` – Helper para resolver slug (query, env, subdomínio) e valores padrão.
- **Atualizações principais**:
  - `App.jsx` envolve a aplicação com `<TenantProvider>` (antes do `<AuthProvider>`).
  - `Settings.jsx` mostra o plano vigente, módulos e canais ativos, além de pré-preencher dados cadastrais.
  - Mantido o branding institucional na landing/login para evitar regressões visuais.
- **Testes adicionados**:
  - `src/utils/__tests__/tenant.test.js` cobre a resolução de slug.
- **Notas**:
  - Caso o backend esteja indisponível, caímos em `DEFAULT_TENANT_META` e o título volta para “TimelyOne”.
  - Próximo passo natural: usar o contexto para condicionar seções (ex.: esconder módulos premium).

### Settings / Branding (FEW-240)

- **Status**: em andamento. Aba "Branding" lê metadados reais do tenant e permite salvar cores/logo. Preview normaliza caminhos relativos (`/media/...`) e trata erros de upload (limite 2MB, URL inválida).
- **Faltando**:
  - Backend ainda não remove o arquivo de logo ao receber `logo_url` vazio (`BE-BUG` aberto). O front exibe aviso e mantém logo padrão até correção.
  - Outras abas (Geral/Notificações/Negócio) ainda usam placeholders e aguardam endpoints dedicados.
- **Observações**:
  - Tema parcial aplicado: navbar, cards principais e botões usam a paleta do tenant; restante do layout permanece no estilo padrão até concluirmos o redesign.
  - Documentação/issue atualizada para acompanhar bug do logo (FEW-BUG).

### Slug e bootstrap do tenant (FEW-213/FEW-214)

- **Contexto**: Com o backend devolvendo o bloco `tenant` nos fluxos de auth e expondo `/api/users/me/tenant/`, o FEW precisa garantir que o slug/meta sejam persistidos imediatamente para aplicar branding sem depender de querystring.
- **Principais componentes**:
  - `src/contexts/AuthContext.jsx` agora hidrata o `TenantProvider` após login, refresh ou registro (`fetchTenantBootstrap`) e expõe `tenant` no contexto global.
  - `src/contexts/TenantContext.jsx` ganhou `applyTenantBootstrap`, permitindo receber meta pré-carregada antes do fetch oficial, além de respeitar o slug vindo do Auth.
  - `src/pages/Register.jsx` aplica o slug/meta retornados pelo registro antes de redirecionar para o login.
- **Decisões**:
  - Bootstrap com refresh busca `/users/me/tenant/` silenciosamente e repassa meta ao provider para evitar flashes sem branding.
  - Ao sair da sessão, o slug volta para `DEFAULT_TENANT_META.slug`, mantendo o login com tema institucional.
- **Pendências**:
  - Ajustar a Landing/Login para aplicar tema mesmo sem autenticação (quando fizer sentido de UX) e documentar smoke tests no FEW-215.

### Wizard de Planos / Checkout (FEW-208)

- Contexto: preparar UI do wizard de planos e integração com checkout, com suporte a modo mock enquanto o backend de billing (BE-210) não está disponível.
- Componentes:
  - `src/pages/Plans.jsx` – seleção de plano (basic/standard/pro) e botão de checkout.
  - `src/api/billing.js` – `createCheckoutSession(plan)` chama `payments/checkout/session/` ou simula quando `VITE_BILLING_MOCK=true`.
  - Rota protegida `/plans` adicionada no `Router.jsx`.
- Notas:
  - Em dev, defina `VITE_BILLING_MOCK=true` para simular redirecionamento (`/checkout/mock?plan=...`).
  - Em produção, a API deve devolver `{ checkout_url }`.

### Gestão de equipe (FEW-252)

- **Contexto**: habilitar owners e managers a convidar, promover e desativar membros da equipe diretamente no painel Admin, com fluxo público de aceite de convite.
- **Principais componentes**:
  - `src/pages/Team.jsx` – filtros, botões e integração com os hooks `useStaff` para convidar/atualizar membros.
  - `src/components/team/InviteStaffModal.jsx` e `ManageStaffModal.jsx` – modais com validação, feedback de `X-Request-ID` e bloqueios conforme permissões.
  - `src/components/ui/Modal.jsx` – camada base reutilizável para modais acessíveis (escape, focus trap básico).
  - `src/pages/StaffInviteAccept.jsx` – página pública que recebe `token` na URL, coleta senha e confirma o convite.
- **Comportamentos relevantes**:
  - Apenas o owner pode convidar ou promover alguém para o papel de manager; managers criam colaboradores.
  - Todas as ações exibem confirmações e mantêm estado de carregamento para evitar cliques duplicados.
  - Convites bem-sucedidos retornam token + expiração para compartilhamento manual quando necessário.
  - A página de aceite exige senha ≥ 8 caracteres, permite ajustar nome/sobrenome e redireciona para o login após sucesso (com countdown).
- **Testes adicionados**:
  - `src/components/team/__tests__/InviteStaffModal.test.jsx`
  - `src/components/team/__tests__/ManageStaffModal.test.jsx`
  - `src/pages/__tests__/Team.test.jsx`
  - `src/pages/__tests__/StaffInviteAccept.test.jsx`
- **Observações**:
  - Fluxo de reenvio de convite/histórico depende de endpoints adicionais (planejado em FEW-301).
  - QA precisa validar tokens reais no ambiente staging assim que o backend liberar seed dedicada.
