# 🏪 Salonix Frontend Web (FEW)

**Plataforma de agendamento para salões de beleza** - Painel web para profissionais e donos gerenciarem agenda, serviços e acompanharem relatórios.

[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.2.0-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.1-38B2AC.svg)](https://tailwindcss.com/)
[![i18n](https://img.shields.io/badge/i18n-PT%2FEN-green.svg)](https://www.i18next.com/)

## 🎯 Visão Geral do Produto

**Salonix** é uma plataforma completa de agendamento para salões de beleza e profissionais autônomos, composta por:

- **🏠 Frontend Web (FEW)** - Painel administrativo para profissionais/donos
- **📱 Mobile App (MOB)** - Aplicativo para clientes finais
- **⚙️ Backend (BE)** - API Django REST Framework

### 👥 Público-Alvo

| Usuário | Acesso | Funcionalidades |
|---------|--------|-----------------|
| **Clientes** | App Mobile | Agendamentos, histórico, feedback |
| **Profissionais/Donos** | Frontend Web | Gestão de agenda, serviços, relatórios |
| **Admin Interno** | Django Admin | Manutenção e suporte |

## 🏗️ Arquitetura do Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend Web  │    │   Mobile App    │    │     Backend     │
│   (React SPA)   │◄──►│ (React Native)  │◄──►│  (Django API)   │
│                 │    │                 │    │                 │
│ • Dashboard     │    │ • Agendamentos  │    │ • Autenticação  │
│ • Gestão        │    │ • Serviços      │    │ • Relatórios    │
│ • Relatórios    │    │ • Feedback      │    │ • Cache Redis   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 🔐 Autenticação
- **JWT Tokens** via `/api/users/token/`
- **Feature Flags** para controle de acesso
- **Autorização** por escopo de usuário

## ✨ Funcionalidades do Frontend Web

### 🔐 Autenticação e Sessão
- **Login/Logout** com JWT
- **Cadastro** de novos usuários
- **Recuperação** de senha
- **Sessões** persistentes

### 📅 Gestão de Agenda
- **Slots disponíveis** - Configuração de horários
- **Agendamentos** - Visualização e gestão
- **Confirmações** - Status e notificações
- **Cancelamentos** - Políticas e permissões

### 👥 Gestão de Profissionais
- **Cadastro** de profissionais
- **Especialidades** e áreas de atuação
- **Contatos** e informações
- **Permissões** e níveis de acesso

### 🎯 Gestão de Serviços
- **Cadastro** de serviços
- **Preços** e duração
- **Categorias** e descrições
- **Disponibilidade** por profissional

### 📊 Relatórios e Analytics
- **Overview** - Métricas gerais
- **Top Services** - Serviços mais populares
- **Receita** - Análise por período
- **Exportação CSV** - Dados para análise externa

### 💬 Comunicação
- **Chat interno** - Comunicação com clientes
- **Feedback** - Sistema de avaliações
- **Notificações** - Alertas e lembretes

### ⚙️ Configurações
- **Perfil do negócio** - Informações básicas
- **Horários** - Configuração de funcionamento
- **Notificações** - Preferências de comunicação
- **Integrações** - APIs e webhooks

## 🛠️ Stack Tecnológica

### Frontend
- **React 18** - Biblioteca principal
- **Vite** - Build tool e dev server
- **React Router** - Navegação SPA
- **Tailwind CSS** - Framework de estilos
- **Lucide React** - Ícones

### Estado e Dados
- **React Hooks** - Gerenciamento de estado
- **Context API** - Estado global
- **Axios** - Cliente HTTP

### Internacionalização
- **i18next** - Framework de i18n
- **react-i18next** - Integração React
- **PT/EN** - Português e Inglês

### Qualidade
- **ESLint** - Linting de código
- **Prettier** - Formatação
- **Jest** - Testes unitários

## 📦 Instalação e Configuração

### Pré-requisitos
- **Node.js** 18+
- **npm** ou **yarn**
- **Backend** rodando (para desenvolvimento)

### Passos de Instalação

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd salonix-frontend-web
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env.local
# Edite .env.local com suas configurações
```

4. **Execute o projeto**
```bash
npm run dev
```

5. **Acesse no navegador**
```
http://localhost:5173
```

## 🔧 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |
| `npm run lint` | Verificação de código |
| `npm run test` | Execução de testes |

## 🌍 Configuração de Ambientes

### Desenvolvimento (.env.local)
```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=Salonix Dev
VITE_DEBUG=true
```

### Staging
```env
VITE_API_URL=https://api-staging.salonix.com
VITE_APP_NAME=Salonix Staging
VITE_DEBUG=false
```

### Produção
```env
VITE_API_URL=https://api.salonix.com
VITE_APP_NAME=Salonix
VITE_DEBUG=false
```

## 📁 Estrutura do Projeto

```
src/
├── api/                    # APIs e configurações HTTP
│   ├── auth.js            # Autenticação JWT
│   └── client.js          # Cliente Axios configurado
├── components/            # Componentes reutilizáveis
│   ├── ui/               # Componentes de interface
│   │   ├── FormButton.jsx
│   │   ├── FormInput.jsx
│   │   ├── Card.jsx
│   │   └── ...
│   └── icons/            # Ícones customizados
├── contexts/              # Contextos React
│   ├── AuthContext.jsx   # Contexto de autenticação
│   └── AuthContextInstance.js
├── hooks/                 # Hooks customizados
│   └── useAuth.js        # Hook de autenticação
├── i18n/                  # Internacionalização
│   ├── index.js          # Configuração i18next
│   └── locales/          # Traduções PT/EN
├── layouts/               # Layouts das páginas
│   ├── AuthLayout.jsx    # Layout de autenticação
│   └── FullPageLayout.jsx # Layout principal
├── pages/                 # Páginas da aplicação
│   ├── Dashboard.jsx     # Dashboard principal
│   ├── Services.jsx      # Gestão de serviços
│   ├── Professionals.jsx # Gestão de profissionais
│   ├── Bookings.jsx      # Gestão de agendamentos
│   ├── Chat.jsx          # Sistema de chat
│   ├── Feedback.jsx      # Sistema de feedback
│   ├── Settings.jsx      # Configurações
│   └── ...
├── routes/                # Configuração de rotas
│   ├── Router.jsx        # Roteador principal
│   └── PrivateRoute.jsx  # Proteção de rotas
├── styles/                # Estilos globais
│   └── index.css         # Tailwind e customizações
└── utils/                 # Utilitários e helpers
    └── validators.js     # Validações de formulário
```

## 🔐 Sistema de Autenticação

### JWT Integration
- **Login** via `/api/users/token/`
- **Refresh tokens** automático
- **Interceptors** para requisições autenticadas
- **Logout** com limpeza de estado

### Feature Flags
- **Controle de acesso** por funcionalidade
- **Relatórios** - `reports_enabled`
- **Chat** - `chat_enabled`
- **Feedback** - `feedback_enabled`

### Rotas Protegidas
- Todas as páginas internas requerem autenticação
- **Redirecionamento** automático para `/login`
- **Persistência** de sessão

## 📱 Responsividade e UX

### Design System
- **Componentes consistentes** com Tailwind CSS
- **Variantes padronizadas** (primary, success, warning, danger)
- **Espaçamentos** e tipografia consistentes
- **Cores** e estados visuais unificados

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Navegação
- **Header** responsivo com menu hamburger
- **Mobile nav** com navegação inferior
- **Breadcrumbs** para navegação hierárquica

## 🌍 Internacionalização

### Idiomas Suportados
- **Português (PT)** - Idioma padrão
- **Inglês (EN)** - Idioma alternativo

### Estrutura de Traduções
```json
{
  "nav": {
    "home": "Início",
    "services": "Serviços"
  },
  "auth": {
    "login": "Entrar",
    "register": "Cadastrar"
  }
}
```

### Uso nos Componentes
```jsx
import { useTranslation } from 'react-i18next';

function MeuComponente() {
  const { t } = useTranslation();
  return <h1>{t('nav.home')}</h1>;
}
```

## 🔌 Integração com Backend

### API Endpoints
- **Base URL** configurável por ambiente
- **Autenticação** via headers JWT
- **Rate limiting** com retry/backoff
- **Error handling** padronizado

### Relatórios
- **Respeito aos rate limits** do backend
- **Paginação** com headers customizados
- **Download CSV** com progress indicators
- **Cache** e invalidação

### Tratamento de Erros
- **401** - Token inválido/expirado
- **403** - Feature flag desabilitada
- **429** - Rate limit excedido
- **500** - Erro interno do servidor

## 🧪 Testes e Qualidade

### Testes Unitários
- **Jest** como framework principal
- **Testing Library** para componentes
- **Mocks** para APIs externas
- **Coverage** mínimo de 80%

### Linting e Formatação
- **ESLint** para qualidade de código
- **Prettier** para formatação
- **Husky** para pre-commit hooks
- **CI/CD** com GitHub Actions

## 🚀 Deploy e Produção

### Build de Produção
```bash
npm run build
# Gera pasta dist/ com arquivos otimizados
```

### Deploy Options
- **Vercel** - Deploy automático
- **Netlify** - Deploy com preview
- **AWS S3 + CloudFront** - Deploy estático
- **Docker** - Containerização

### Variáveis de Produção
- **DEBUG=false** - Desabilita logs de debug
- **API_URL** - URL da API de produção
- **ANALYTICS** - Chaves de analytics

## 📊 Monitoramento e Analytics

### Métricas de Performance
- **Core Web Vitals** - LCP, FID, CLS
- **Lighthouse** - Score de performance
- **Bundle Analyzer** - Tamanho dos bundles

### Error Tracking
- **Sentry** - Rastreamento de erros
- **Logs** estruturados
- **User feedback** automático

## 🔒 Segurança

### Boas Práticas
- **HTTPS** obrigatório em produção
- **CORS** configurado corretamente
- **XSS Protection** via React
- **CSRF Protection** via tokens

### Dados Sensíveis
- **Nunca** commitar secrets no Git
- **Variáveis de ambiente** para configurações
- **Rotação** de chaves JWT

## 🗺️ Roadmap

### MVP (Concluído ✅)
- [x] Sistema de autenticação
- [x] Gestão de serviços e profissionais
- [x] Sistema de agendamentos
- [x] Dashboard básico
- [x] Chat e feedback
- [x] Configurações do negócio

### Pós-MVP 🚀
- [ ] **Relatórios avançados** - Gráficos e dashboards
- [ ] **Notificações push** - Integração com mobile
- [ ] **Multi-tenant** - Suporte a múltiplos salões
- [ ] **Integrações** - WhatsApp, SMS, email
- [ ] **Analytics** - Métricas de negócio
- [ ] **PWA** - Progressive Web App

### Futuro 🔮
- [ ] **AI/ML** - Recomendações inteligentes
- [ ] **AR/VR** - Visualização de serviços
- [ ] **Marketplace** - Conectando clientes e profissionais
- [ ] **Pagamentos** - Integração com gateways

## 🤝 Contribuição

### Como Contribuir
1. **Fork** o projeto
2. **Crie** uma branch para sua feature
3. **Commit** suas mudanças
4. **Push** para a branch
5. **Abra** um Pull Request

### Padrões de Código
- **ESLint** para qualidade
- **Prettier** para formatação
- **Conventional Commits** para mensagens
- **Testes** para novas funcionalidades

## 📚 Documentação Adicional

- **API Docs** - [Backend Repository](link-para-backend)
- **Mobile App** - [Mobile Repository](link-para-mobile)
- **Design System** - [Figma](link-para-figma)
- **Deploy Guide** - [Wiki](link-para-wiki)

## 👥 Equipe

**Criativo Devs** - Equipe de desenvolvimento apaixonada por criar soluções inovadoras e funcionais.

- **Pablo** - Desenvolvedor Full Stack & UX/UI
- **Claude** - Assistente de Desenvolvimento

### 🎯 Nossa Missão
Transformar ideias em realidade através de código limpo, design intuitivo e soluções que fazem a diferença.

## 📞 Suporte

- **Issues** - [GitHub Issues](link-para-issues)
- **Documentação** - [Wiki](link-para-wiki)
- **Email** - criativodes@gmail.com
- **Discord** - [Comunidade](link-para-discord)

## 📄 Licença

Este projeto está sob a licença **MIT**. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

**Salonix Frontend Web** - Transformando a gestão de salões de beleza 🚀

*Desenvolvido com ❤️ pela equipe Criativo Devs*
