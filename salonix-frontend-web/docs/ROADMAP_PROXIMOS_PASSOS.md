# 🗺️ Roadmap – Próximos Passos Frontend

## 1. Monetização e Planos
- **FEW-208 – Wizard de seleção de plano/checkout**
  - Dependência direta do backend (BE-210 – billing)
  - Preparar placeholders caso API ainda não esteja disponível
- **FEW-213/214 – Slug do tenant e bootstrap com refresh**
  - Depende dos ajustes BE-233/234 para devolver slug e meta light.
  - Garantir que registro redireciona com branding aplicado imediatamente.

## 2. Onboarding Produtivo
- **FEW-209 – Onboarding guiado**
  - Requer API de progresso (BE-211)
  - Incluir dados demo opcionais

## 3. Segurança
- **FEW-210 – Hardening de autenticação**
  - Sincronizado com BE-212 (rate limit, captcha, RBAC)

## 4. Outras iniciativas futuras
- Dashboard com métricas em tempo real
- Integração com notificações web push (dependente de flags de plano)
- Localização completa (PT-PT → EN → ES)
- Ajustar smoke seeds/QA checklist com senha padrão (FEW-215)

> Revise este arquivo a cada planning. Itens concluídos movem-se para `IMPLEMENTACOES_FRONTEND.md` e novos épicos entram com contexto e dependências.
