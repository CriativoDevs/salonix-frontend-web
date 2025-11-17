# 🚦 Current MVP Status – Frontend Web (FEW) – October 2025

## Language / Idiomas
- EN: English version first
- PT: Versão em Português abaixo

## ✅ Completed / Stable (≈62%)

- FEW-201 — Real authentication with backend (login/register/refresh/logout + error handling).
- FEW-207 — Institutional landing page (PT content, CTAs, SEO base).
- FEW-230/231 — Full password recovery flow + captcha/429.
- FEW-241b — Available hours (slot CRUD integrated with BE).
- FEW-240 (partial) — Settings reads real branding/plan/modules: single badge in Settings, colors/logo via PATCH, modules reflect plan benefits (e.g., Client PWA always in Standard+).
- FEW-252 — Team management (owner/managers): invite via modal, update roles/status with permissions, and public invite acceptance page.

## 🏗️ In Progress / Next

- FEW-240 — finish: final copy, plan-based blocking messages, theme preferences (depends on BE-270).
- FEW-241a/242 — CRUD professionals/services/scheduling with backend (100% real panel).
- FEW-208/209 — plan wizard + guided onboarding after registration.
- FEW-244/245 — real paywall + refined 429 UX.
- FEW-246 — CaptchaGate/envs documentation.

## 🔗 Dependencies & Integrations
- Current credit badge (€) updated via realtime channel (SSE recommended; WS optional).
- `/api/credits/*` endpoints in BE for credit purchase and history.
- Plans table and credit limits updated in the Landing Page.

## 🧭 MVP Goal

Deliver a self-service experience for business owners in Portugal:
1. Discover the product via landing.
2. Register, choose plan/trial, and configure the business via onboarding.
3. Operate scheduling and reports with security and appropriate feedback.
4. Consume features aligned with the plan (real paywall + BE channels/links).

Current status: flows 1 and 3 work; steps 2 and 4 still depend on open tasks (wizard, paywall, real communications in BE).

## 📈 Suggested Control Indicators

- Landing → registration conversion rate.
- Onboarding completion (steps completed / average time).
- Authentication errors by cause (credential, lockout, captcha, backend).

> Update this page whenever a delivery directly impacts the user journey or the MVP value proposition.
> Update all documents across projects (FEW and BE).
> Keep responses short, no flattery, and provide opinions.

---

## 🇵🇹 Status Atual do MVP – Frontend Web (FEW) – Outubro 2025

### ✅ Concluído / Estável (≈62%)

- **FEW-201 – Autenticação real com backend** (login/register/refresh/logout + tratamento de erros).
- **FEW-207 – Landing page institucional** (conteúdo PT, CTA, base SEO).
- **FEW-230/231 – Fluxo completo de recuperação de senha + captcha/429.**
- **FEW-241b – Horários disponíveis** (CRUD de slots integrado ao BE).
- **FEW-240 (parcial)** – Settings lê branding/plan/modules reais: badge única no Settings, cores/logo via PATCH, módulos refletem benefícios do plano (ex.: PWA Cliente sempre em Standard+).
- **FEW-252 – Gestão de equipe (owner/managers)**: convite via modal, atualização de papéis/status com permissões e página pública de aceite de convite.

### 🏗️ Em Andamento / Próximo

- **FEW-240 – concluir**: permitir copy final, mensagens de bloqueio por plano, preferências de tema (depende do BE-270).
- **FEW-241a/242** – CRUD profissionais/serviços/agendamentos com backend (painel 100% real).
- **FEW-208/209** – wizard de planos + onboarding guiado após registro.
- **FEW-244/245** – paywall real + UX de 429 refinada.
- **FEW-246** – documentação CaptchaGate/envs.

### 🔗 Dependências e Integrações
- Badge de crédito atual (€) atualizado via canal realtime (SSE recomendado; WS opcional conforme necessidade).
- Endpoints `/api/credits/*` no BE para compra de crédito e histórico.
- Tabela de planos e limites de crédito atualizados na Landing Page.

### 🧭 Meta do MVP

Entregar uma experiência self-service para proprietários de negócio em Portugal:
1. Descobrir o produto pela landing.
2. Registar, escolher plano/trial e configurar empresa via onboarding.
3. Operar agenda e relatórios com segurança e feedback apropriado.
4. Consumir recursos condizentes com o plano (paywall real + canais/ligações ao BE).

Status atual: fluxo 1 e 3 funcionam; os passos 2 e 4 ainda dependem de tasks abertas (wizard, paywall, comunicações reais no BE).

### 📈 Indicadores de controle sugeridos

- Taxa de conversão landing → registro.
- Conclusão do onboarding (passos completos / tempo médio).
- Erros de autenticação por causa (credencial, lockout, captcha, backend).

> Atualize esta página sempre que uma entrega impactar diretamente a jornada do usuário ou a proposta de valor do MVP.
> Atualize todos os documentos dentro dos projetos (FEW e BE).
> Mantenha as respostas curtas, sem puxar saco e opine.
