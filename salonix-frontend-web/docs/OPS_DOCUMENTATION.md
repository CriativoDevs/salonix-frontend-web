# Documentação Técnica - Ops Console (Salonix)

## Visão Geral

O **Ops Console** é a interface administrativa interna do Salonix, destinada às equipes de Operações, Suporte e Engenharia. Ele permite o monitoramento da plataforma, gestão de tenants, resolução de alertas e intervenções de suporte.

## Arquitetura

O Ops Console é construído como uma área isolada dentro da aplicação React principal (`salonix-frontend-web`), mas utiliza um contexto de autenticação separado (`OpsAuthContext`) para garantir segurança e segregação de acesso.

### Estrutura de Pastas

- `src/pages/ops/`: Contém as páginas específicas do Ops (Dashboard, Tenants, Support, etc.).
- `src/layouts/OpsLayout.jsx`: Layout principal com sidebar e navegação do Ops.
- `src/contexts/OpsAuthContext.jsx`: Gerencia a sessão de usuários Ops (separado do AuthContext de clientes).
- `src/hooks/useOps*.js`: Hooks customizados para interagir com a API Ops (Metrics, Alerts, Support).

## Autenticação

A autenticação é via JWT, utilizando endpoints específicos:
- Login: `/api/ops/auth/login/`
- Refresh: `/api/ops/auth/refresh/`
- Me: `/api/ops/auth/me/`

O token é armazenado no `localStorage` com as chaves `ops_access_token` e `ops_refresh_token`.

## Funcionalidades Principais

### 1. Dashboard (`/ops/dashboard`)
- **KPIs**: Total de Tenants, Trials Expirando, MRR Estimado, Alertas Abertos.
- **Gráfico**: Volume de notificações enviadas nos últimos 7 dias.
- **Alertas Recentes**: Lista rápida de problemas pendentes.

### 2. Central de Suporte (`/ops/support`)
- **Reenvio de Notificações**: Permite reenviar manualmente notificações (Email/SMS/WhatsApp) falhadas.
- **Desbloqueio de Contas (Lockout)**: Remove bloqueios de segurança (login brute-force) de usuários finais.
- **Gestão de Alertas**: Lista completa de alertas do sistema com opção de marcar como resolvido.

### 3. Gestão de Usuários Ops (`/ops/users`)
- Listagem de operadores e administradores com acesso ao console.

## Desenvolvimento e Extensão

Para adicionar novas funcionalidades:
1. Crie a página em `src/pages/ops/`.
2. Crie os hooks necessários em `src/hooks/` usando `useOpsAuth` para acessar a API.
3. Adicione a rota em `src/routes/Router.jsx` (dentro do escopo `/ops/*`).
4. Adicione o item de menu em `src/layouts/OpsLayout.jsx`.

## Padrões de Código
- Use `useOpsAuth` para obter a instância do axios (`api`) configurada com interceptors.
- Trate erros com blocos try/catch e exiba mensagens amigáveis.
- Siga o padrão de UI do Tailwind CSS existente.
