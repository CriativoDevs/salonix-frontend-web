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

## Slug e bootstrap do tenant (FEW-213/FEW-214)

- **Contexto**: Backend passa a devolver `tenant.slug` (mais bloco mínimo de meta) nos endpoints de registro/login, além de expor `GET /api/users/me/tenant/` para bootstrap apenas com refresh token.
- **Principais componentes** (planeado para próxima iteração):
  - `src/contexts/AuthContext.jsx` – guardar `tenantSlug`/meta rápida logo após register/login e quando bootstrap roda com refresh.
  - `src/contexts/TenantContext.jsx` – aceitar slug vindo do Auth antes de tentar resolver query/host.
  - `src/pages/Register.jsx` – consumir payload com slug e encaminhar para dashboard já tematizado.
- **Decisões**:
  - Slug é sempre gerado pelo BE; FEW apenas persiste e injeta no provider.
  - Seeds/smokes terão senha padrão (documentada) para que possamos validar branding com dados conhecidos.
- **Pendências**:
  - Ajustar smokes e docs após BE-233/BE-234/BE-235 concluídos.
