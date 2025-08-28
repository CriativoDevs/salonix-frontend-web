# 🏪 Salonix Frontend Web

Sistema de gerenciamento completo para salões de beleza, desenvolvido em React com foco em usabilidade e design responsivo.

## ✨ Características

- **🎨 Interface Moderna**: Design limpo e responsivo com Tailwind CSS
- **🌍 Internacionalização**: Suporte completo para português e inglês
- **📱 Responsivo**: Funciona perfeitamente em desktop, tablet e mobile
- **🔐 Autenticação**: Sistema completo de login, cadastro e recuperação de senha
- **⚡ Performance**: Desenvolvido com Vite para máxima velocidade
- **🧪 Testes**: Configuração Jest para testes automatizados

## 🚀 Funcionalidades

### 🔐 Autenticação
- **Login**: Acesso ao sistema
- **Cadastro**: Criação de nova conta
- **Recuperação de Senha**: Sistema de reset via email

### 📊 Dashboard
- **Métricas**: Agendamentos, receita, clientes e ocupação
- **Ações Rápidas**: Acesso direto às funcionalidades principais
- **Próximos Agendamentos**: Visão geral dos compromissos

### 👥 Gestão de Profissionais
- **Cadastro**: Adicionar novos profissionais
- **Especialidades**: Definição de áreas de atuação
- **Contatos**: Informações de contato

### 🎯 Serviços
- **Cadastro**: Criação de novos serviços
- **Preços**: Definição de valores
- **Duração**: Tempo estimado para cada serviço

### 📅 Agendamentos
- **Visualização**: Lista completa de compromissos
- **Detalhes**: Cliente, serviço, profissional e horário
- **Gestão**: Controle total dos agendamentos

### ⏰ Horários Disponíveis
- **Configuração**: Definição de slots disponíveis
- **Seleção de Data**: Escolha de datas específicas
- **Visualização**: Horários organizados por dia

### 💬 Chat
- **Conversas**: Lista de chats com clientes
- **Mensagens**: Sistema de comunicação em tempo real
- **Notificações**: Indicadores de mensagens não lidas

### ⭐ Feedback
- **Avaliações**: Sistema de 1 a 5 estrelas
- **Categorias**: Organização por tipo de feedback
- **Anônimo**: Opção de envio anônimo

### ⚙️ Configurações
- **Geral**: Informações básicas do negócio
- **Notificações**: Preferências de comunicação
- **Horários**: Configuração de funcionamento
- **Agendamentos**: Duração e intervalos

## 🛠️ Tecnologias

- **Frontend**: React 18 + Vite
- **Estilização**: Tailwind CSS
- **Roteamento**: React Router DOM
- **Internacionalização**: i18next + react-i18next
- **Ícones**: Lucide React
- **Testes**: Jest + Testing Library
- **Linting**: ESLint + Prettier
- **Build**: Vite

## 📦 Instalação

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn

### Passos

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd salonix-frontend-web
```

2. **Instale as dependências**
```bash
npm install
```

3. **Execute o projeto**
```bash
npm run dev
```

4. **Acesse no navegador**
```
http://localhost:5173
```

## 🎯 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera build de produção |
| `npm run preview` | Preview do build de produção |
| `npm run lint` | Executa o linter (ESLint) |
| `npm run test` | Executa os testes (Jest) |

## 📁 Estrutura do Projeto

```
src/
├── api/                    # APIs e configurações HTTP
├── components/            # Componentes reutilizáveis
│   ├── ui/               # Componentes de interface
│   └── icons/            # Ícones customizados
├── contexts/              # Contextos React (Auth)
├── hooks/                 # Hooks customizados
├── i18n/                  # Configuração de internacionalização
│   └── locales/          # Arquivos de tradução (PT/EN)
├── layouts/               # Layouts das páginas
├── pages/                 # Páginas da aplicação
├── routes/                # Configuração de rotas
├── styles/                # Estilos globais
└── utils/                 # Utilitários e helpers
```

## 🌍 Internacionalização

O projeto suporta **português** e **inglês** através do i18next:

- **Português (PT)**: Idioma padrão
- **Inglês (EN)**: Idioma alternativo

### Adicionando Novas Traduções

1. **Arquivo PT**: `src/i18n/locales/pt.json`
2. **Arquivo EN**: `src/i18n/locales/en.json`

### Uso nos Componentes

```jsx
import { useTranslation } from 'react-i18next';

function MeuComponente() {
  const { t } = useTranslation();
  
  return <h1>{t('minha.chave.traducao')}</h1>;
}
```

## 🎨 Componentes UI

### Componentes Principais
- **Container**: Layout responsivo centralizado
- **FormButton**: Botões com variantes (primary, success, warning, danger)
- **FormInput**: Campos de entrada padronizados
- **Card**: Containers de conteúdo
- **PageHeader**: Cabeçalhos de página

### Variantes de Botões
```jsx
<FormButton variant="primary">Primário</FormButton>
<FormButton variant="success">Sucesso</FormButton>
<FormButton variant="warning">Aviso</FormButton>
<FormButton variant="danger">Perigo</FormButton>
<FormButton variant="outline">Contorno</FormButton>
```

## 🔐 Sistema de Autenticação

### Contexto de Auth
- **AuthContext**: Gerenciamento global do estado de autenticação
- **useAuth**: Hook para acessar dados de autenticação
- **PrivateRoute**: Proteção de rotas privadas

### Rotas Protegidas
Todas as páginas internas são protegidas e redirecionam para `/login` se não autenticado.

## 📱 Responsividade

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px  
- **Desktop**: > 1024px

### Navegação
- **Desktop**: Header horizontal completo
- **Mobile**: Navegação inferior com ícones

## 🧪 Testes

### Executar Testes
```bash
npm run test
```

### Configuração
- **Jest**: Framework de testes
- **Testing Library**: Utilitários para testes de componentes
- **jsdom**: Ambiente DOM para testes

## 🚀 Deploy

### Build de Produção
```bash
npm run build
```

### Arquivos Gerados
- `dist/`: Pasta com arquivos otimizados
- `index.html`: Arquivo principal
- `assets/`: CSS, JS e outros recursos

## 🔧 Configuração

### Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz:

```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=Salonix
```

### Tailwind CSS
- **Configuração**: `tailwind.config.js`
- **Cores**: Sistema de cores personalizado
- **Componentes**: Classes utilitárias customizadas

## 📝 Convenções de Código

### Nomenclatura
- **Componentes**: PascalCase (`UserProfile.jsx`)
- **Arquivos**: PascalCase para componentes, camelCase para utilitários
- **Funções**: camelCase (`handleSubmit`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)

### Estrutura de Componentes
```jsx
import React from 'react';
import { useTranslation } from 'react-i18next';

function MeuComponente({ prop1, prop2 }) {
  const { t } = useTranslation();
  
  // Hooks
  // Estados
  // Funções
  // Render
  
  return <div>Conteúdo</div>;
}

export default MeuComponente;
```

## 🐛 Troubleshooting

### Problemas Comuns

**Erro de Porta**
```bash
# Se a porta 5173 estiver ocupada
npm run dev -- --port 3000
```

**Dependências Corrompidas**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Build Falhando**
```bash
npm run build --verbose
```

## 🤝 Contribuição

1. **Fork** o projeto
2. **Crie** uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. **Commit** suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. **Push** para a branch (`git push origin feature/AmazingFeature`)
5. **Abra** um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 👥 Equipe

- **Desenvolvimento**: Equipe Salonix
- **Design**: UX/UI Team
- **QA**: Quality Assurance Team

## 📞 Suporte

- **Email**: suporte@salonix.com
- **Documentação**: [docs.salonix.com](https://docs.salonix.com)
- **Issues**: [GitHub Issues](https://github.com/salonix/issues)

---

**Salonix Frontend Web** - Transformando a gestão de salões de beleza 🚀
