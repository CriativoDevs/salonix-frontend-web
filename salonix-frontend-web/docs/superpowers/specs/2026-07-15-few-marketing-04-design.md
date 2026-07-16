# FEW-MARKETING-04: Página de auto-cadastro do cliente + fix Founder/Basic UI — Design

**Issue:** #317 (FEW-MARKETING-04)
**Branch:** `317-few-marketing-04`
**Depende de:** BE-MARKETING-03 (concluída, merged — endpoint `POST /api/public/<slug>/clients/register/`).

## Contexto

O tenant pode gerar um link único com o seu slug para partilhar com potenciais clientes (redes sociais, WhatsApp, etc.). Ao abrir esse link, o cliente vê um formulário de registo e cria a sua conta de forma autónoma, sem depender do tenant para o registar manualmente. O link não é secreto — qualquer pessoa que descubra o slug do tenant (já exposto noutros pontos públicos da plataforma) consegue aceder à página; captcha e rate limiting protegem contra abuso, não contra descoberta do link.

Além do escopo original da issue, esta tarefa também substitui o mecanismo client-side de disponibilidade Founder/Basic (`checkFounderAvailability()` + filtro manual) pela fonte de verdade já corrigida no backend (`overview.available_plans[].is_available`), nas 3 páginas autenticadas que iniciam checkout — combinado com o Pablo em 2026-07-15, mesmo padrão de bundling usado na BE-MARKETING-03.

## Parte 1 — Página pública `/join/:tenantSlug`

### Rota

Nova rota pública em `src/routes/Router.jsx`, sem wrapper `PublicRoute`/`PrivateRoute` (igual a `/client/enter`):

```jsx
<Route path="/join/:tenantSlug" element={<ClientSelfRegister />} />
```

### Página `src/pages/ClientSelfRegister.jsx`

Segue o padrão de `src/pages/ClientEnter.jsx` + `src/hooks/useClientTenant.js`, adaptado:

1. Lê `tenantSlug` via `useParams()` (não `getStoredTenantSlug()`).
2. Ao montar, busca dados públicos do tenant via `fetchPublicTenant(tenantSlug)` (`src/api/tenant.js`, já existe) — mostra nome/logo no topo da página. Se a chamada falhar com 404, mostra estado "Link inválido ou salão não encontrado" (sem formulário).
3. Formulário: nome completo, email, telefone — mesmos campos que `PublicClientRegistrationSerializer` aceita no backend (`name` obrigatório, `email`/`phone_number` opcionais mas pelo menos um dos dois, `marketing_opt_in` opcional, sem campo de senha).
4. `CaptchaChallenge` (novo componente, ver Parte 2) acima do botão de submit.
5. Submit → `POST /api/public/<tenantSlug>/clients/register/` (nova função `registerClientPublic()` em `src/api/clientAccess.js` ou novo `src/api/clientSelfRegister.js`).
6. Sucesso (201) → estado de confirmação, mesmo padrão visual de `ClientEnter.jsx` (`bg-green-50` card): "Verifique o seu email para definir a senha".
7. Erros tratados especificamente via `parseApiError`:
   - 404 (tenant não encontrado/inativo/sem PWA Cliente) → estado "Link inválido", sem mostrar formulário.
   - 400 com email duplicado → mensagem clara + link para `/client/login`.
   - 400 de validação de campo (nome/telefone) → erro inline no campo correspondente.
   - 429 → "Muitas tentativas. Aguarde uns minutos e tente novamente."

### Botão "Copiar link de registo" + QR Code

Em `src/pages/Customers.jsx`, no `PageHeader` (perto dos botões existentes de adicionar/importar cliente):

- **"Copiar link de registo"**: `navigator.clipboard.writeText(`${window.location.origin}/join/${tenantSlug}`)`, feedback via `useToast()` (hook já existente no projeto — substitui o padrão `alert()` usado em `Bookings.jsx`).
- **"Gerar QR Code"**: abre um `Modal` (componente já existente) com o QR code do mesmo link, renderizado no cliente via biblioteca leve nova (`qrcode.react` — adicionar como dependência), com botão de download da imagem (PNG).

### i18n

Nova chave de topo `"join"` em `pt.json`/`en.json`, seguindo a convenção de nesting por página already usada (`client_enter`, `client_login`, etc.):

```json
"join": {
  "loading": "...",
  "tenant_not_found": "...",
  "form": { "name": "...", "email": "...", "phone": "...", "submit": "..." },
  "success_title": "...",
  "success_message": "...",
  "errors": { "duplicate_email": "...", "rate_limited": "..." }
}
```

Mais chaves em `"customers"` para os 2 novos botões e o modal de QR code.

## Parte 2 — Captcha: `CaptchaChallenge.jsx`

Investigação confirmou que `django-simple-captcha` já está montado em `api/captcha/` e expõe `GET /api/captcha/refresh/`, que devolve `{key, image_url}`.

**Novo componente** `src/components/security/CaptchaChallenge.jsx`, usado só na página `/join` (não mexe no `CaptchaGate.jsx` existente nem nas 5 páginas que o usam hoje — ver `to_see.md`, item registado para tratar essa inconsistência separadamente):

- **Dev** (quando `getCaptchaBypassToken()` retorna valor): não renderiza nada; a página envia `captcha_value: <bypass_token>` no corpo do POST, sem `captcha_key` — o backend aceita isso (`enforce_captcha_or_raise` valida o bypass antes de exigir a key).
- **Staging/produção**: ao montar, chama `GET /api/captcha/refresh/` (novo `src/api/captcha.js`), guarda `{key, image_url}` em estado, mostra a imagem (`<img src={image_url} />`) + input de texto para a resposta + botão "🔄" que rebusca um novo desafio. Expõe `onChange({ captcha_key, captcha_value })` ao componente pai a cada alteração do input.

A chamada de registo envia `captcha_key`/`captcha_value` no corpo do POST (não como headers — o backend lê `request.data.get("captcha_key"/"captcha_value")` primeiro, antes dos headers).

## Parte 3 — Fix de UI Founder/Basic

Substitui `checkFounderAvailability()` + filtro manual de `PLAN_OPTIONS` nas **3 páginas autenticadas que iniciam checkout** — `Plans.jsx`, `PlanOnboarding.jsx`, `RegisterCheckout.jsx`. `Landing.jsx` **não é alterada** (página pública de marketing, não inicia checkout, mantém `checkFounderAvailability()`/`PLAN_OPTIONS` como estão).

### Abordagem: merge, não substituição

`PLAN_OPTIONS` continua a ser a fonte da cópia de marketing (nome, `price`/`price_annual` formatados, `highlights` em PT) — isso não existe no backend. O que muda é a fonte de **disponibilidade**: em vez de `checkFounderAvailability()` + 2 `useEffect`s recalculando um array filtrado, cada página cruza `PLAN_OPTIONS` com `overview.available_plans[]` (por `plan_code`) para decidir, por plano, `is_available`/`is_current`/`can_upgrade`.

Nova função utilitária `src/utils/planAvailability.js`:

```js
export function mergePlanAvailability(planOptions, availablePlans) {
  const byCode = new Map((availablePlans || []).map((p) => [p.plan_code, p]));
  return planOptions
    .filter((option) => byCode.has(option.code))
    .map((option) => ({ ...option, ...byCode.get(option.code) }));
}
```

Isso: (a) só mostra planos que o backend considera existentes/relevantes para este tenant (ex.: `pro` bloqueado nunca aparece, `founder` só aparece quando `AVAILABLE_PLANS`/`get_available_plans` o incluir), (b) cada item resultante tem `is_available`/`is_current`/`can_upgrade` vindos do backend, sobrepostos à cópia visual do `PLAN_OPTIONS`.

### Mudanças por arquivo

- **`Plans.jsx`**: remove `checkFounderAvailability` (import), `founderAvailable` state, e os 2 `useEffect`s que o calculam/reagem. `plans` passa a ser `useMemo(() => mergePlanAvailability(PLAN_OPTIONS, overview?.available_plans), [overview?.available_plans])`. O botão "Mudar para este plano"/"Continuar para checkout" ganha `disabled={... || !p.is_available}`.
- **`PlanOnboarding.jsx`**: mesma mudança — já usa `useBillingOverview()`, só troca a fonte de `plans`.
- **`RegisterCheckout.jsx`**: adiciona `useBillingOverview()` (está atrás de `PrivateRoute`, autenticado — mesma situação das outras duas), aplica o mesmo `mergePlanAvailability`.

### Testes

Cada uma das 3 páginas ganha/atualiza testes cobrindo: plano indisponível (`is_available: false`) renderiza botão desabilitado; plano disponível permite clique; `founderAvailable`/`checkFounderAvailability` deixam de ser chamados/mockados nesses testes.

## Fora de escopo

- As 5 páginas existentes com mismatch de captcha (`Login`, `Register`, `ForgotPassword`, `ClientEnter`, feedback) — registado em `to_see.md`, não é urgente (`CAPTCHA_ENABLED=false` em produção).
- `Landing.jsx` — mantém `checkFounderAvailability()`/`PLAN_OPTIONS` como estão (não inicia checkout).
- Réplica no app nativo (MOB) — tarefa futura separada, conforme combinado.
- Token de convite único (em vez de slug simples) para `/join` — decisão consciente de manter o link público/partilhável, conforme a issue original pede.

## Testes gerais

- `ClientSelfRegister.jsx`: tenant válido + registo bem-sucedido; tenant não encontrado (404); email duplicado (400); erro de validação de campo; rate limit (429); captcha bypass em dev.
- `CaptchaChallenge.jsx`: renderiza imagem quando sem bypass; não renderiza nada quando bypass presente; botão de refresh busca novo desafio.
- Botões "Copiar link"/"Gerar QR Code" em `Customers.jsx`: copia o link correto; abre modal com QR code.
- `mergePlanAvailability()`: unit tests puros (merge correto, planos ausentes no backend não aparecem, campos de cópia preservados).
