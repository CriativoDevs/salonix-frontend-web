# 📡 FEW Endpoints - Salonix Frontend Web

Este documento lista todos os endpoints de API utilizados no Salonix Frontend Web (FEW).

## 🔐 Autenticação e Usuário

### Users / Auth
- `POST /api/users/token/` - Login (obter access/refresh tokens)
- `POST /api/users/token/refresh/` - Renovar access token
- `POST /api/users/register/` - Registro de novo usuário
- `GET /api/users/me/features/` - Buscar feature flags do usuário
- `GET /api/users/me/tenant/` - Bootstrap do tenant (metadados)
- `GET /api/users/me/profile/` - Buscar perfil do usuário atual
- `PATCH /api/users/me/profile/` - Atualizar perfil do usuário atual

### Password Reset
- `POST /api/users/password/reset/` - Solicitar reset de senha
- `POST /api/users/password/reset/confirm/` - Confirmar reset de senha

### Tenant Meta (Público)
- `GET /api/users/tenant/meta/` - Buscar metadados públicos do tenant

---

## 👥 Staff (Equipe)

- `GET /api/users/staff/` - Listar membros da equipe
- `POST /api/users/staff/` - Convidar novo membro
- `PATCH /api/users/staff/` - Atualizar membro (role, status)
- `DELETE /api/users/staff/` - Desabilitar membro
- `POST /api/users/staff/accept/` - Aceitar convite (público)
- `POST /api/users/staff/resend/` - Reenviar convite
- `POST /api/users/staff/access-link/` - Enviar link de acesso
- `PATCH /api/users/staff/contact/` - Atualizar contato de membro

---

## 👤 Clientes

### Cliente - Área Logada (Cliente)
- `GET /api/clients/me/profile/` - Perfil do cliente logado
- `PATCH /api/clients/me/profile/` - Atualizar perfil do cliente
- `GET /api/clients/me/appointments/upcoming/` - Agendamentos futuros
- `GET /api/clients/me/appointments/history/` - Histórico de agendamentos
- `PATCH /api/clients/me/appointments/{id}/cancel/` - Cancelar agendamento
- `POST /api/clients/me/appointments/` - Criar agendamento (cliente)

### Customers (Gestão pelo Salão)
- `GET /api/salon/customers/` - Listar clientes (paginado)
- `GET /api/salon/customers/{id}/` - Detalhes de um cliente
- `POST /api/salon/customers/` - Criar cliente
- `PATCH /api/salon/customers/{id}/` - Atualizar cliente
- `DELETE /api/salon/customers/{id}/` - Excluir cliente
- `POST /api/salon/customers/{id}/resend-invite/` - Reenviar convite

---

## 📅 Agendamentos

### Appointments
- `GET /api/salon/appointments/` - Listar agendamentos (paginado, com filtros)
- `GET /api/appointments/{id}/` - Detalhes de um agendamento
- `POST /api/appointments/` - Criar agendamento
- `POST /api/appointments/bulk/` - Criar múltiplos agendamentos em lote
- `POST /api/appointments/series/` - Criar série de agendamentos recorrentes
- `POST /api/appointments/mixed-bulk/` - Criar agendamentos mistos (bulk)
- `PATCH /api/appointments/{id}/` - Atualizar agendamento
- `DELETE /api/appointments/{id}/` - Cancelar/excluir agendamento

---

## 🕐 Slots (Horários Disponíveis)

- `GET /api/slots/` - Listar slots (horários) disponíveis
  - Parâmetros: `professional_id`, `date_from`, `date_to`, `is_available`
- `GET /api/slots/{id}/` - Detalhes de um slot
- `POST /api/slots/` - Criar slot
- `DELETE /api/slots/{id}/` - Excluir slot

---

## 💼 Serviços

- `GET /api/salon/services/` - Listar serviços
- `GET /api/salon/services/{id}/` - Detalhes de um serviço
- `POST /api/salon/services/` - Criar serviço
- `PATCH /api/salon/services/{id}/` - Atualizar serviço
- `DELETE /api/salon/services/{id}/` - Excluir serviço

---

## 👨‍💼 Profissionais

- `GET /api/salon/professionals/` - Listar profissionais
- `GET /api/salon/professionals/{id}/` - Detalhes de um profissional
- `POST /api/salon/professionals/` - Criar profissional
- `PATCH /api/salon/professionals/{id}/` - Atualizar profissional
- `DELETE /api/salon/professionals/{id}/` - Excluir profissional

---

## 📊 Dashboard

- `GET /api/dashboard/overview/` - Visão geral do dashboard (KPIs)
- `GET /api/dashboard/revenue-series/` - Série temporal de receita
  - Parâmetros: `interval` (day, week, month)
- `GET /api/dashboard/bookings/` - Dados de agendamentos para dashboard
- `GET /api/dashboard/customers/` - Dados de clientes para dashboard

---

## 📈 Relatórios (Reports)

### Business Analysis
- `GET /api/reports/top-services/` - Serviços mais populares
  - Parâmetros: `from`, `to`, `limit`, `offset`
  - **Requer plano Standard+**

### Outros Reports (inferidos)
- `GET /api/reports/revenue/` - Relatório de receita
- `GET /api/reports/appointments/` - Relatório de agendamentos
- `GET /api/reports/customers/` - Relatório de clientes

---

## 💳 Créditos

- `GET /api/credits/packages/` - Listar pacotes de créditos disponíveis
- `POST /api/credits/payment-intent/` - Criar intenção de pagamento (Stripe)
- `POST /api/credits/checkout-session/` - Criar sessão de checkout (Stripe)

---

## 🏪 Tenant

- `GET /api/tenant/` - Informações do tenant atual
- `PATCH /api/tenant/` - Atualizar configurações do tenant

---

## 🔧 Headers Customizados

### Autenticação
- `Authorization: Bearer {token}` - JWT token (access token)

### Multi-tenancy
- `X-Tenant-Slug: {slug}` - Identificação do tenant
- Query param: `?tenant={slug}` - Alternativa ao header

### Internacionalização
- `Accept-Language: pt-PT` ou `en` - Idioma da resposta

### Rate Limiting
- `X-Request-ID` - ID único da requisição (resposta)
- Headers de rate limit (resposta):
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

### Captcha (quando habilitado)
- `X-Captcha-Token: {token}` - Token de validação captcha

---

## 📦 Paginação

### Query Parameters
- `limit` - Número de itens por página
- `offset` - Número de itens a pular
- `page_size` - Alias para `limit`
- `ordering` - Campo para ordenação (ex: `name`, `-created_at`)

### Response Headers
- `X-Total-Count` - Total de itens
- `X-Limit` - Limite aplicado
- `X-Offset` - Offset aplicado
- `Link` - Links para próxima/anterior página (formato RFC 5988)

---

## 🔍 Filtros Comuns

### Appointments
- `status` - confirmed, pending, cancelled, completed
- `date_from` - Data inicial (ISO 8601)
- `date_to` - Data final (ISO 8601)
- `customer_id` - ID do cliente
- `professional_id` - ID do profissional
- `service_id` - ID do serviço

### Slots
- `professional_id` - ID do profissional
- `is_available` - true/false
- `date_from` - Data inicial
- `date_to` - Data final

---

## ⚠️ Tratamento de Erros

### Status Codes
- `401` - Token inválido/expirado (redireciona para login)
- `403` - Feature flag desabilitada ou sem permissão
- `429` - Rate limit excedido (exibe toast com retry)
- `500` - Erro interno do servidor

### Retry Logic
- Retry automático em erros 5xx (com backoff exponencial)
- Refresh automático de token em 401 (uma tentativa)
- Fallback para polling se SSE falhar

---

## 📝 Notas de Implementação

### Endpoints Públicos (sem autenticação)
- `/api/public/*`
- `/api/users/tenant/meta/`
- `/api/users/password/reset/`
- `/api/users/password/reset/confirm/`
- `/api/users/staff/accept/`

### Endpoints Privados (requerem autenticação)
- Todos os demais endpoints requerem `Authorization: Bearer {token}`
- Token de cliente tem precedência sobre token de staff nas rotas compartilhadas

### Base URL
- **Desenvolvimento**: `http://localhost:8000/api/` (via proxy Vite `/api`)
- **Staging**: `https://timelyonestaging.pythonanywhere.com/api/`
- **Produção**: Configurado via `VITE_API_BASE_URL`

---

## 🚀 Próximos Passos

Este documento será atualizado conforme novos endpoints forem implementados. Para implementar o MOB (Mobile Backend), garanta que:

1. ✅ Todos os endpoints listados aqui sejam compatíveis
2. ✅ Headers de multi-tenancy (`X-Tenant-Slug`) sejam respeitados
3. ✅ Autenticação JWT funcione da mesma forma
4. ✅ Paginação use os mesmos padrões (limit/offset + headers)
5. ✅ Rate limiting seja implementado consistentemente

---

**Última atualização**: 2026-02-16
**Versão**: 1.0.0
**Responsável**: FEW Team
