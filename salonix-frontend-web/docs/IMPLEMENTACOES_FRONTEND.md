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
