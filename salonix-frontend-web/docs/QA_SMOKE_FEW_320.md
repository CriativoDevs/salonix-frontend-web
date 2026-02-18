# QA Smoke Checklist — Billing & Subscription (FEW-232 / FEW-320)

## Language / Idiomas
- EN: English version first
- PT: Versão em Português abaixo

---

## 🇺🇸 EN: Billing & Subscription Smoke Checklist

This checklist validates the Billing implementation across two scenarios: **Mock Mode** (Dev) and **Real Integration** (Staging).

### 1. Environment Setup

- [ ] **Mock Mode (Dev):** Ensure `VITE_BILLING_MOCK=true` in `.env`.
- [ ] **Real Mode (Staging):** Ensure `VITE_BILLING_MOCK=false` and `STRIPE_PUBLISHABLE_KEY` is set.

### 2. Registration Flow (Mock & Real)

- [ ] **Sign Up:** Register a new Tenant via `/register`.
- [ ] **Plan Selection:** Verify user is redirected to Dashboard with "Basic" (or default) plan active.
- [ ] **Visual Check:** Confirm "Basic Plan" badge appears in Settings > Billing.

### 3. Upgrade Flow (Basic -> Pro)

#### Scenario A: Mock Mode (`VITE_BILLING_MOCK=true`)
- [ ] Go to **Settings > Plans**.
- [ ] Click "Upgrade" on **Pro Plan**.
- [ ] **Expected:** Modal opens, simulate loading, show "Success" toast.
- [ ] **Result:** UI immediately updates to "Pro Plan" (Mock state).

#### Scenario B: Real Mode (`VITE_BILLING_MOCK=false`)
- [ ] Go to **Settings > Plans**.
- [ ] Click "Upgrade" on **Pro Plan**.
- [ ] **Expected:** Redirect to **Stripe Checkout** page (hosted by Stripe).
- [ ] **Action:** Complete payment with test card (e.g., `4242...`).
- [ ] **Return:** Redirect back to Salonix `/billing/success`.
- [ ] **Result:** Dashboard shows "Pro Plan" (after Webhook processing). *Note: May require page refresh if websocket not active.*

### 4. Subscription Management (Portal)

- [ ] Click **"Manage Subscription"** in Settings.
  - **Mock:** Shows alert/toast "Opening Customer Portal (Mock)".
  - **Real:** Redirects to **Stripe Billing Portal**.
- [ ] **Cancel Subscription (Real only):**
  - Cancel plan in Stripe Portal.
  - Return to Salonix.
  - Verify status updates to "Cancels at period end".

### 5. Credits Balance (FEW-320)

- [ ] **View Balance:** Dashboard and Settings show correct credit amount.
- [ ] **Real-time Update:**
  - Simulate backend credit update (via Admin or API).
  - Verify UI updates automatically via SSE (without refresh).
- [ ] **Network Failure:** Disconnect network, verify Polling fallback takes over.

---

## 🇵🇹 PT: Checklist de Smoke Test — Faturamento e Assinatura

Este checklist valida a implementação de Faturamento em dois cenários: **Modo Mock** (Dev) e **Integração Real** (Staging).

### 1. Configuração de Ambiente

- [ ] **Modo Mock (Dev):** Garantir `VITE_BILLING_MOCK=true` no `.env`.
- [ ] **Modo Real (Staging):** Garantir `VITE_BILLING_MOCK=false` e `STRIPE_PUBLISHABLE_KEY` configurada.

### 2. Fluxo de Registro (Mock & Real)

- [ ] **Cadastro:** Registrar novo Tenant via `/register`.
- [ ] **Seleção de Plano:** Verificar redirecionamento para Dashboard com plano "Basic" (ou padrão) ativo.
- [ ] **Checagem Visual:** Confirmar badge "Plano Basic" em Configurações > Faturamento.

### 3. Fluxo de Upgrade (Basic -> Pro)

#### Cenário A: Modo Mock (`VITE_BILLING_MOCK=true`)
- [ ] Ir para **Configurações > Planos**.
- [ ] Clicar em "Upgrade" no **Plano Pro**.
- [ ] **Esperado:** Modal abre, simula carregamento, exibe toast de "Sucesso".
- [ ] **Resultado:** UI atualiza imediatamente para "Plano Pro" (estado Mock).

#### Cenário B: Modo Real (`VITE_BILLING_MOCK=false`)
- [ ] Ir para **Configurações > Planos**.
- [ ] Clicar em "Upgrade" no **Plano Pro**.
- [ ] **Esperado:** Redirecionamento para página de **Checkout do Stripe**.
- [ ] **Ação:** Completar pagamento com cartão de teste (ex: `4242...`).
- [ ] **Retorno:** Redirecionamento de volta para Salonix `/billing/success`.
- [ ] **Resultado:** Dashboard exibe "Plano Pro" (após processamento do Webhook). *Nota: Pode requerer refresh se websocket não estiver ativo.*

### 4. Gestão de Assinatura (Portal)

- [ ] Clicar em **"Gerenciar Assinatura"** em Configurações.
  - **Mock:** Exibe alerta/toast "Abrindo Portal do Cliente (Mock)".
  - **Real:** Redireciona para **Portal de Faturamento Stripe**.
- [ ] **Cancelar Assinatura (Apenas Real):**
  - Cancelar plano no Portal Stripe.
  - Retornar ao Salonix.
  - Verificar se status atualiza para "Cancela ao fim do período".

### 5. Saldo de Créditos (FEW-320)

- [ ] **Ver Saldo:** Dashboard e Configurações mostram valor correto de créditos.
- [ ] **Atualização em Tempo Real:**
  - Simular atualização de crédito no backend (via Admin ou API).
  - Verificar se UI atualiza automaticamente via SSE (sem refresh).
- [ ] **Falha de Rede:** Desconectar rede, verificar se fallback de Polling assume.
