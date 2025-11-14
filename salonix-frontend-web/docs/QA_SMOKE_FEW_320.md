# QA Smoke FEW-320

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