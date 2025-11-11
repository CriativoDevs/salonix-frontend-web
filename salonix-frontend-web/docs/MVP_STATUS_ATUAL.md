# 🚦 Status Atual do MVP – Frontend Web (FEW) – Outubro 2025

## ✅ Concluído / Estável (≈62%)

- **FEW-201 – Autenticação real com backend** (login/register/refresh/logout + tratamento de erros).
- **FEW-207 – Landing page institucional** (conteúdo PT, CTA, base SEO).
- **FEW-230/231 – Fluxo completo de recuperação de senha + captcha/429.**
- **FEW-241b – Horários disponíveis** (CRUD de slots integrado ao BE).
- **FEW-240 (parcial)** – Settings lê branding/plan/modules reais: badge única no Settings, cores/logo via PATCH, módulos refletem benefícios do plano (ex.: PWA Cliente sempre em Standard+).
- **FEW-252 – Gestão de equipe (owner/managers)**: convite via modal, atualização de papéis/status com permissões e página pública de aceite de convite.

## 🏗️ Em Andamento / Próximo

- **FEW-240 – concluir**: permitir copy final, mensagens de bloqueio por plano, preferências de tema (depende do BE-270).
- **FEW-241a/242** – CRUD profissionais/serviços/agendamentos com backend (painel 100% real).
- **FEW-208/209** – wizard de planos + onboarding guiado após registro.
- **FEW-244/245** – paywall real + UX de 429 refinada.
- **FEW-246** – documentação CaptchaGate/envs.

## 🔗 Dependências e Integrações
- Badge de crédito atual (€) atualizado via canal realtime (SSE recomendado; WS opcional conforme necessidade).
- Endpoints `/api/credits/*` no BE para compra de crédito e histórico.
- Tabela de planos e limites de crédito atualizados na Landing Page.

## 🧭 Meta do MVP

Entregar uma experiência self-service para proprietários de negócio em Portugal:
1. Descobrir o produto pela landing.
2. Registar, escolher plano/trial e configurar empresa via onboarding.
3. Operar agenda e relatórios com segurança e feedback apropriado.
4. Consumir recursos condizentes com o plano (paywall real + canais/ligações ao BE).

Status atual: fluxo 1 e 3 funcionam; os passos 2 e 4 ainda dependem de tasks abertas (wizard, paywall, comunicações reais no BE).

## 📈 Indicadores de controle sugeridos

- Taxa de conversão landing → registro.
- Conclusão do onboarding (passos completos / tempo médio).
- Erros de autenticação por causa (credencial, lockout, captcha, backend).

> Atualize esta página sempre que uma entrega impactar diretamente a jornada do usuário ou a proposta de valor do MVP.
> Atualize todos os documentos dentro dos projetos (FEW e BE).
> Mantenha as respostas curtas, sem puxar saco e opine.
