# 🛠️ Implementações do Frontend Web

## Autenticação e Sessão (FEW-201)

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

### Hardening (FEW-231)

- **Contexto**: Alinhar com o BE-212 para reduzir abuso nos endpoints públicos.
- **Implementações**:
  - `CaptchaGate` em Login/Registro/Forgot com modos `turnstile`/`hcaptcha`/`builtin` e bypass em dev (`VITE_CAPTCHA_BYPASS_TOKEN`).
  - Envio do token de captcha no header `X-Captcha-Token`.
  - Tratamento de 429 (Rate Limit) baseado no header `Retry-After` (mensagem amigável).
- **Env (FE)**:
  - `VITE_CAPTCHA_BYPASS_TOKEN` – token para dev
  - `VITE_CAPTCHA_PROVIDER` – `turnstile | hcaptcha | builtin`
  - `VITE_TURNSTILE_SITEKEY` / `VITE_HCAPTCHA_SITEKEY`

## Como documentar próximas features

1. Crie uma subseção com identificador da issue (ex: `## Landing Page (FEW-207)`).
2. Liste contexto, arquivos tocados, decisões de UX/tecnologia, testes e pendências.
3. Adicione insights para o produto ou integrações cruzadas (ex.: dependências do backend).

> Manter este arquivo atualizado facilita revisar o histórico técnico sem caçar PRs antigas.

## Landing page institucional (FEW-207)

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

## Theming e Feature Flags por Tenant (FEW-202)

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

## Settings / Branding (FEW-240)

- **Status**: em andamento. Aba "Branding" lê metadados reais do tenant e permite salvar cores/logo. Preview normaliza caminhos relativos (`/media/...`) e trata erros de upload (limite 2MB, URL inválida).
- **Faltando**:
  - Backend ainda não remove o arquivo de logo ao receber `logo_url` vazio (`BE-BUG` aberto). O front exibe aviso e mantém logo padrão até correção.
  - Outras abas (Geral/Notificações/Negócio) ainda usam placeholders e aguardam endpoints dedicados.
- **Observações**:
  - Tema parcial aplicado: navbar, cards principais e botões usam a paleta do tenant; restante do layout permanece no estilo padrão até concluirmos o redesign.
  - Documentação/issue atualizada para acompanhar bug do logo (FEW-BUG).

## Slug e bootstrap do tenant (FEW-213/FEW-214)

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
## Wizard de Planos / Checkout (FEW-208)

- Contexto: preparar UI do wizard de planos e integração com checkout, com suporte a modo mock enquanto o backend de billing (BE-210) não está disponível.
- Componentes:
  - `src/pages/Plans.jsx` – seleção de plano (basic/standard/pro) e botão de checkout.
  - `src/api/billing.js` – `createCheckoutSession(plan)` chama `payments/checkout/session/` ou simula quando `VITE_BILLING_MOCK=true`.
  - Rota protegida `/plans` adicionada no `Router.jsx`.
- Notas:
  - Em dev, defina `VITE_BILLING_MOCK=true` para simular redirecionamento (`/checkout/mock?plan=...`).
  - Em produção, a API deve devolver `{ checkout_url }`.
