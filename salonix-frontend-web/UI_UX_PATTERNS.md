# Padrões UI/UX - Salonix Frontend

## 🚨 REGRA FUNDAMENTAL - BOTÕES

### ⚠️ IMPORTANTE: Aparência de Botões
**TODOS os botões do projeto DEVEM ter aparência de LINKS, não de botões tradicionais.**

#### ✅ Padrão Correto para Botões
```jsx
// Botões devem parecer links - sem bordas, sem background sólido
<button className="text-brand-primary hover:text-brand-primary/80 font-medium transition-colors">
  Atualizar plano
</button>

// Ou usando elemento <a> com onClick
<a 
  href="#" 
  onClick={handleClick}
  className="text-brand-primary hover:text-brand-primary/80 font-medium transition-colors"
>
  Exportar CSV
</a>
```

#### ❌ EVITAR - Aparência de Botão Tradicional
```jsx
// NÃO usar - aparência de botão com background e bordas
<button className="bg-blue-500 text-white px-4 py-2 rounded-lg border">
  Botão Tradicional
</button>
```

### 🌓 Suporte a Temas
**SEMPRE respeitar os temas claro e escuro usando as variáveis CSS do sistema.**

---

## 📋 Índice
- [Sistema de Cores e Temas](#sistema-de-cores-e-temas)
- [Componentes de Feedback](#componentes-de-feedback)
- [Tipografia](#tipografia)
- [Espaçamento e Layout](#espaçamento-e-layout)
- [Componentes Reutilizáveis](#componentes-reutilizáveis)
- [Estados de Loading](#estados-de-loading)
- [Tratamento de Erros](#tratamento-de-erros)

---

## 🎨 Sistema de Cores e Temas

### Variáveis CSS (themes.css)
**SEMPRE use as variáveis CSS definidas em `src/styles/themes.css`:**

```css
/* Cores principais */
--bg-primary: #ffffff (light) / #0f172a (dark)
--bg-secondary: #f8fafc (light) / #1e293b (dark)
--text-primary: #0f172a (light) / #f8fafc (dark)
--text-secondary: #475569 (light) / #cbd5e1 (dark)

/* Estados */
--success: #10b981 (light) / #34d399 (dark)
--warning: #f59e0b (light) / #fbbf24 (dark)
--error: #ef4444 (light) / #f87171 (dark)
--info: #3b82f6 (light) / #60a5fa (dark)
```

### ✅ Boas Práticas
```jsx
// ✅ CORRETO - Usar variáveis CSS
<div style={{ color: 'var(--success)' }}>Sucesso</div>

// ❌ EVITAR - Cores hardcoded
<div className="text-green-800">Sucesso</div>
```

---

## 🔔 Componentes de Feedback

### Sistema de Toast
**Localização:** `src/components/ui/Toast.jsx` e `src/hooks/useToast.js`

#### Uso Básico
```jsx
import useToast from '../hooks/useToast';
import ToastContainer from '../components/ui/ToastContainer';

function MyComponent() {
  const { toasts, showSuccess, showError, showWarning, showInfo, hideToast } = useToast();

  const handleSuccess = () => {
    showSuccess('Operação realizada com sucesso!');
  };

  const handleError = () => {
    showError('Erro ao processar solicitação.');
  };

  return (
    <div>
      {/* Seu conteúdo */}
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </div>
  );
}
```

#### Opções Avançadas
```jsx
showSuccess('Mensagem', {
  duration: 5000,        // 5 segundos (padrão: 4000)
  position: 'top-left'   // Posições disponíveis
});

// Posições: top-left, top-center, top-right, bottom-left, bottom-center, bottom-right
```

### ✅ Quando Usar Toast
- ✅ Feedback de ações (salvar, deletar, atualizar)
- ✅ Notificações de erro/sucesso
- ✅ Alertas temporários
- ❌ Informações críticas que precisam de confirmação
- ❌ Conteúdo que o usuário precisa ler com atenção

---

## 📝 Tipografia

### Hierarquia de Texto
```jsx
// Títulos principais
<h1 className="text-2xl font-bold theme-text-primary">Título Principal</h1>

// Subtítulos
<h2 className="text-xl font-semibold theme-text-primary">Subtítulo</h2>

// Texto corpo
<p className="text-sm theme-text-secondary">Texto normal</p>

// Texto auxiliar
<span className="text-xs theme-text-muted">Informação adicional</span>
```

### ✅ Boas Práticas
- Use classes utilitárias do themes.css: `theme-text-primary`, `theme-text-secondary`, `theme-text-muted`
- Mantenha consistência nos tamanhos: `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`

---

## 📏 Espaçamento e Layout

### Grid e Flexbox
```jsx
// Container principal
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

// Grid responsivo
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Flex com espaçamento
<div className="flex items-center justify-between gap-4">
```

### Espaçamentos Padrão
- **Pequeno:** `gap-2`, `p-2`, `m-2` (8px)
- **Médio:** `gap-4`, `p-4`, `m-4` (16px)
- **Grande:** `gap-6`, `p-6`, `m-6` (24px)
- **Extra Grande:** `gap-8`, `p-8`, `m-8` (32px)

---

## 🧩 Componentes Reutilizáveis

### Botões e Links
**PADRÃO: Links e botões de ação NÃO devem ter sublinhado por padrão**

#### Links de Ação (sem sublinhado)
```jsx
// ✅ CORRETO - Link de ação sem sublinhado
<button className="text-brand-primary hover:text-brand-primary/80 font-medium transition-colors">
  Aplicar filtros
</button>

// ✅ CORRETO - Link de exportação sem sublinhado  
<button className="text-brand-primary hover:text-brand-primary/80 font-medium transition-colors inline-flex items-center">
  Exportar CSV
</button>

// ❌ EVITAR - Links com sublinhado (apenas para navegação)
<a className="text-brand-primary hover:underline">Link de navegação</a>
```

#### Quando usar sublinhado
- **Links de navegação:** Entre páginas ou seções
- **Links externos:** Para sites externos
- **Links informativos:** Em textos corridos

#### Quando NÃO usar sublinhado
- **Botões de ação:** Aplicar filtros, exportar, salvar
- **Links funcionais:** Dentro de interfaces/formulários
- **Botões estilizados como links:** Ações do sistema

### Card Component
```jsx
import Card from '../components/ui/Card';

<Card>
  <Card.Header>
    <h2>Título do Card</h2>
  </Card.Header>
  <Card.Content>
    Conteúdo do card
  </Card.Content>
</Card>
```

### Button Patterns
```jsx
// Botão primário
<button className="btn-primary">Ação Principal</button>

// Botão secundário
<button className="btn-secondary">Ação Secundária</button>

// Botão com estado de loading
<button disabled={loading} className="btn-primary">
  {loading ? 'Carregando...' : 'Salvar'}
</button>
```

---

## ⏳ Estados de Loading

### Skeleton Loading
```jsx
// Para listas
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
</div>

// Para cards
<div className="animate-pulse bg-gray-200 rounded-lg h-32"></div>
```

### Spinner Loading
```jsx
<div className="flex justify-center items-center p-8">
  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
</div>
```

---

## ❌ Tratamento de Erros

### Estados de Erro
```jsx
// Erro inline
{error && (
  <div className="text-sm" style={{ color: 'var(--error)' }}>
    {error.message}
  </div>
)}

// Erro em card
{error && (
  <Card>
    <div className="text-center p-8">
      <div className="text-red-500 mb-2">⚠️</div>
      <p style={{ color: 'var(--error)' }}>
        Erro ao carregar dados
      </p>
      <button onClick={retry} className="btn-secondary mt-4">
        Tentar Novamente
      </button>
    </div>
  </Card>
)}
```

### ✅ Boas Práticas para Erros
- Sempre forneça uma ação para recuperação (retry, voltar, etc.)
- Use linguagem clara e não técnica
- Prefira toasts para erros temporários
- Use estados inline para erros de validação

---

## 🎯 Diretrizes Gerais

### ✅ Sempre Fazer
1. **Usar variáveis CSS** do themes.css para cores
2. **Implementar estados de loading** para operações assíncronas
3. **Fornecer feedback visual** para todas as ações do usuário
4. **Manter consistência** nos espaçamentos e tipografia
5. **Testar em ambos os temas** (claro e escuro)

### ❌ Evitar
1. **Cores hardcoded** em CSS ou classes Tailwind
2. **Ações sem feedback** visual
3. **Inconsistência** nos padrões de layout
4. **Componentes não reutilizáveis** para funcionalidades similares
5. **Estados de erro** sem opção de recuperação

---

## 📚 Recursos Adicionais

### Arquivos de Referência
- **Temas:** `src/styles/themes.css`
- **Toast System:** `src/components/ui/Toast.jsx`, `src/hooks/useToast.js`
- **Componentes Base:** `src/components/ui/`
- **Layouts:** `src/layouts/`

### Ferramentas de Desenvolvimento
- **Tailwind CSS:** Para utilitários de estilo
- **Lucide React:** Para ícones consistentes
- **React i18next:** Para internacionalização

---

*Documento criado para padronizar o desenvolvimento UI/UX e reduzir retrabalho na equipe.*