# QA Smoke FEW-320

## Language / Idiomas
- EN: English version first
- PT: Versão em Português abaixo

Quick checklist to validate Configuration and QA (Item 4):

- Login with default user (tenant `default`).
- View balance in Dashboard and Settings (`Credits: X.XX`).
- Click badges → balance updates (no request spamming).
- Simulate SSE (backend dev): hit `/api/auth/realtime/credits/` with token → verify UI updates on `credit_update`.
- Disconnect SSE (block network) → fallback polling shows heartbeat and allows manual refresh.

Environments:
- Dev: `VITE_API_URL=http://localhost:8000/api/` (frontend) and `CORS_ALLOW_ALL_ORIGINS=true` (backend).
- Staging: `CORS_ALLOW_ALL_ORIGINS=false` and `CORS_ALLOWED_ORIGINS` with FE domains.

If any step fails, capture browser console and backend logs.

---

## 🇵🇹 QA Smoke FEW-320

Checklist rápido para validar Configuração e QA (Item 4):

- Login com usuário padrão (tenant `default`).
- Ver saldo em Dashboard e Settings (`Créditos: X,XX`).
- Clicar nos badges → atualiza saldo (sem spams de requisições).
- Simular SSE (backend dev): acessar `/api/auth/realtime/credits/` com token → verificar atualizações na UI ao ocorrer `credit_update`.
- Desconectar SSE (bloquear rede) → fallback polling mostra heartbeat e permite refresh manual.

Ambientes:
- Dev: `VITE_API_URL=http://localhost:8000/api/` (frontend) e `CORS_ALLOW_ALL_ORIGINS=true` (backend).
- Staging: `CORS_ALLOW_ALL_ORIGINS=false` e `CORS_ALLOWED_ORIGINS` com domínios do FE.

Se algum passo falhar, capturar console do navegador e logs do backend.