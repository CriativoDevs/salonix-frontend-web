# FEW-MARKETING-04 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public client self-registration page (`/join/:tenantSlug`), a real key/value captcha challenge component for it, and replace the client-side Founder/Basic availability check in the 3 authenticated checkout pages with the backend's already-corrected `is_available` field.

**Architecture:** Part A is a new public page consuming the existing backend endpoint `POST /api/public/<slug>/clients/register/` (BE-MARKETING-03, already merged), following the `ClientEnter.jsx` pattern. Part B is a standalone captcha component using `django-simple-captcha`'s `/api/captcha/refresh/` endpoint, used only by the new page. Part C introduces a pure merge function that combines the existing frontend marketing copy (`PLAN_OPTIONS`) with the backend's per-tenant availability data (`overview.available_plans[]`), replacing the redundant `checkFounderAvailability()` client-side filter in `Plans.jsx`, `PlanOnboarding.jsx`, and `RegisterCheckout.jsx`.

**Tech Stack:** React 18, react-router-dom, react-i18next, Jest + Testing Library, axios (via `src/api/client.js`), new dependency `qrcode.react`.

**IMPORTANT — no automatic commits:** Every "Commit" step below is written for reference only. Do **NOT** run `git add` / `git commit`. Leave all changes in the working tree, tested and green. Pablo commits and pushes everything himself.

---

## Part A — Public page `/join/:tenantSlug`

### Task A1: `registerClientPublic()` API function

**Files:**
- Create: `src/api/clientSelfRegister.js`
- Test: `src/api/__tests__/clientSelfRegister.test.js`

- [ ] **Step 1: Write the failing test**

```js
// src/api/__tests__/clientSelfRegister.test.js
import client from '../client';
import { registerClientPublic } from '../clientSelfRegister';

jest.mock('../client', () => ({
  post: jest.fn(),
}));

describe('registerClientPublic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('posts to the public registration endpoint with the tenant slug in the URL', async () => {
    client.post.mockResolvedValue({
      data: { customer_id: 42, message: 'Cadastro realizado.' },
    });

    const result = await registerClientPublic({
      tenantSlug: 'salao-teste',
      name: 'Maria Silva',
      email: 'maria@example.com',
      phoneNumber: '',
      marketingOptIn: false,
      captchaKey: 'abc123',
      captchaValue: 'xyz',
    });

    expect(client.post).toHaveBeenCalledWith(
      'public/salao-teste/clients/register/',
      {
        name: 'Maria Silva',
        email: 'maria@example.com',
        phone_number: '',
        marketing_opt_in: false,
        captcha_key: 'abc123',
        captcha_value: 'xyz',
      }
    );
    expect(result).toEqual({ customer_id: 42, message: 'Cadastro realizado.' });
  });

  it('omits captcha_key when not provided (dev bypass)', async () => {
    client.post.mockResolvedValue({ data: { customer_id: 1 } });

    await registerClientPublic({
      tenantSlug: 'salao-teste',
      name: 'Maria Silva',
      email: 'maria@example.com',
      captchaValue: 'dev-bypass-token',
    });

    const [, payload] = client.post.mock.calls[0];
    expect(payload.captcha_value).toBe('dev-bypass-token');
    expect(payload).not.toHaveProperty('captcha_key');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- clientSelfRegister.test.js`
Expected: FAIL with `Cannot find module '../clientSelfRegister'`

- [ ] **Step 3: Write the implementation**

```js
// src/api/clientSelfRegister.js
import client from './client';

export async function registerClientPublic({
  tenantSlug,
  name,
  email,
  phoneNumber,
  marketingOptIn,
  captchaKey,
  captchaValue,
}) {
  const payload = {
    name,
    email,
    phone_number: phoneNumber,
    marketing_opt_in: Boolean(marketingOptIn),
    captcha_value: captchaValue,
  };
  if (captchaKey) {
    payload.captcha_key = captchaKey;
  }

  const response = await client.post(
    `public/${tenantSlug}/clients/register/`,
    payload
  );
  return response.data;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- clientSelfRegister.test.js`
Expected: 2 passed

- [ ] **Step 5: Do NOT commit**

---

### Task A2: Route `/join/:tenantSlug`

**Files:**
- Modify: `src/routes/Router.jsx`

- [ ] **Step 1: Add the import**

In `src/routes/Router.jsx`, add near the other page imports (alongside the `ClientEnter` import):

```jsx
import ClientSelfRegister from '../pages/ClientSelfRegister';
```

- [ ] **Step 2: Register the route**

Add near the other unauthenticated client routes (e.g. next to `/client/enter`), with no `PublicRoute`/`PrivateRoute` wrapper:

```jsx
<Route path="/join/:tenantSlug" element={<ClientSelfRegister />} />
```

- [ ] **Step 3: Verify the app still builds**

Run: `npm run build 2>&1 | tail -20`
Expected: build fails at this point because `../pages/ClientSelfRegister` doesn't exist yet — that's expected, move to Task A3 immediately. (If your tooling doesn't like a broken intermediate state, do Steps 1-2 of this task together with Task A3's Step 3, i.e. create a minimal placeholder component first, then flesh it out — either order is fine as long as the final state builds.)

- [ ] **Step 4: Do NOT commit**

---

### Task A3: `ClientSelfRegister.jsx` page

**Files:**
- Create: `src/pages/ClientSelfRegister.jsx`
- Test: `src/pages/__tests__/ClientSelfRegister.test.jsx`

This task depends on Task A1 (`registerClientPublic`) and Task B2 (`CaptchaChallenge`) both existing. If executing tasks in order, do Part B (Tasks B1-B2) before this task, or stub `CaptchaChallenge` inline here and wire it properly once Part B is done.

- [ ] **Step 1: Write the failing tests**

```jsx
// src/pages/__tests__/ClientSelfRegister.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ClientSelfRegister from '../ClientSelfRegister';
import * as tenantApi from '../../api/tenant';
import * as selfRegisterApi from '../../api/clientSelfRegister';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key }),
}));

jest.mock('../../api/tenant');
jest.mock('../../api/clientSelfRegister');

jest.mock('../../components/security/CaptchaChallenge', () => ({
  __esModule: true,
  default: ({ onChange }) => (
    <button
      type="button"
      data-testid="mock-captcha"
      onClick={() =>
        onChange({ captchaKey: 'k1', captchaValue: 'v1' })
      }
    >
      mock captcha
    </button>
  ),
}));

function renderAtSlug(slug) {
  return render(
    <MemoryRouter initialEntries={[`/join/${slug}`]}>
      <Routes>
        <Route path="/join/:tenantSlug" element={<ClientSelfRegister />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ClientSelfRegister', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows the tenant name once loaded', async () => {
    tenantApi.fetchPublicTenant.mockResolvedValue({
      name: 'Salão Teste',
      slug: 'salao-teste',
    });

    renderAtSlug('salao-teste');

    expect(await screen.findByText('Salão Teste')).toBeInTheDocument();
    expect(tenantApi.fetchPublicTenant).toHaveBeenCalledWith('salao-teste');
  });

  it('shows a not-found state when the tenant slug is invalid', async () => {
    tenantApi.fetchPublicTenant.mockRejectedValue({
      response: { status: 404, data: { detail: 'Tenant não encontrado.' } },
    });

    renderAtSlug('does-not-exist');

    expect(
      await screen.findByText(/link inválido/i)
    ).toBeInTheDocument();
  });

  it('submits the form and shows a success message', async () => {
    tenantApi.fetchPublicTenant.mockResolvedValue({ name: 'Salão Teste' });
    selfRegisterApi.registerClientPublic.mockResolvedValue({
      customer_id: 1,
      message: 'Cadastro realizado.',
    });

    renderAtSlug('salao-teste');
    await screen.findByText('Salão Teste');

    fireEvent.change(screen.getByLabelText(/nome/i), {
      target: { value: 'Maria Silva' },
    });
    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: 'maria@example.com' },
    });
    fireEvent.click(screen.getByTestId('mock-captcha'));
    fireEvent.click(screen.getByRole('button', { name: /registar/i }));

    await waitFor(() => {
      expect(selfRegisterApi.registerClientPublic).toHaveBeenCalledWith({
        tenantSlug: 'salao-teste',
        name: 'Maria Silva',
        email: 'maria@example.com',
        phoneNumber: '',
        marketingOptIn: false,
        captchaKey: 'k1',
        captchaValue: 'v1',
      });
    });

    expect(
      await screen.findByText(/verifique o seu email/i)
    ).toBeInTheDocument();
  });

  it('shows a clear message when the email is already registered', async () => {
    tenantApi.fetchPublicTenant.mockResolvedValue({ name: 'Salão Teste' });
    selfRegisterApi.registerClientPublic.mockRejectedValue({
      response: { status: 400, data: { detail: 'Este email já está registado.' } },
    });

    renderAtSlug('salao-teste');
    await screen.findByText('Salão Teste');

    fireEvent.change(screen.getByLabelText(/nome/i), {
      target: { value: 'Maria Silva' },
    });
    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: 'maria@example.com' },
    });
    fireEvent.click(screen.getByTestId('mock-captcha'));
    fireEvent.click(screen.getByRole('button', { name: /registar/i }));

    expect(
      await screen.findByText(/este email já está registado/i)
    ).toBeInTheDocument();
  });

  it('shows a rate limit message on 429', async () => {
    tenantApi.fetchPublicTenant.mockResolvedValue({ name: 'Salão Teste' });
    selfRegisterApi.registerClientPublic.mockRejectedValue({
      response: { status: 429, data: { detail: 'Rate limit exceeded' } },
    });

    renderAtSlug('salao-teste');
    await screen.findByText('Salão Teste');

    fireEvent.change(screen.getByLabelText(/nome/i), {
      target: { value: 'Maria Silva' },
    });
    fireEvent.change(screen.getByLabelText(/e-mail/i), {
      target: { value: 'maria@example.com' },
    });
    fireEvent.click(screen.getByTestId('mock-captcha'));
    fireEvent.click(screen.getByRole('button', { name: /registar/i }));

    expect(
      await screen.findByText(/muitas tentativas/i)
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- ClientSelfRegister.test.jsx`
Expected: FAIL with `Cannot find module '../ClientSelfRegister'`

- [ ] **Step 3: Write the page**

```jsx
// src/pages/ClientSelfRegister.jsx
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AuthLayout from '../layouts/AuthLayout';
import FormInput from '../components/ui/FormInput';
import FormButton from '../components/ui/FormButton';
import CaptchaChallenge from '../components/security/CaptchaChallenge';
import { fetchPublicTenant } from '../api/tenant';
import { registerClientPublic } from '../api/clientSelfRegister';

export default function ClientSelfRegister() {
  const { t } = useTranslation();
  const { tenantSlug } = useParams();

  const [tenant, setTenant] = useState(null);
  const [tenantLoading, setTenantLoading] = useState(true);
  const [tenantNotFound, setTenantNotFound] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [captcha, setCaptcha] = useState({ captchaKey: null, captchaValue: null });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setTenantLoading(true);
    fetchPublicTenant(tenantSlug)
      .then((data) => {
        if (!active) return;
        setTenant(data);
      })
      .catch(() => {
        if (!active) return;
        setTenantNotFound(true);
      })
      .finally(() => {
        if (active) setTenantLoading(false);
      });
    return () => {
      active = false;
    };
  }, [tenantSlug]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (loading) return;
      setLoading(true);
      setError(null);
      try {
        await registerClientPublic({
          tenantSlug,
          name,
          email,
          phoneNumber,
          marketingOptIn: false,
          captchaKey: captcha.captchaKey || undefined,
          captchaValue: captcha.captchaValue,
        });
        setSuccess(true);
      } catch (err) {
        const status = err?.response?.status;
        if (status === 429) {
          setError({
            message: t(
              'join.errors.rate_limited',
              'Muitas tentativas. Aguarde uns minutos e tente novamente.'
            ),
          });
        } else {
          const detail = err?.response?.data?.detail;
          setError({
            message:
              detail ||
              t('join.errors.generic', 'Ocorreu um erro. Tente novamente.'),
          });
        }
      } finally {
        setLoading(false);
      }
    },
    [loading, tenantSlug, name, email, phoneNumber, captcha, t]
  );

  if (tenantLoading) {
    return (
      <AuthLayout>
        <p className="text-center text-sm text-brand-surfaceForeground/70">
          {t('join.loading', 'A carregar…')}
        </p>
      </AuthLayout>
    );
  }

  if (tenantNotFound) {
    return (
      <AuthLayout>
        <p className="text-center text-sm text-brand-surfaceForeground/70">
          {t('join.tenant_not_found', 'Link inválido ou salão não encontrado.')}
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="space-y-4">
        <h1 className="text-xl font-semibold text-center">{tenant?.name}</h1>
        <p className="text-sm text-center text-brand-surfaceForeground/70">
          {t('join.subtitle', 'Registe-se para aceder à sua área de cliente')}
        </p>

        {!success && (
          <>
            <FormInput
              label={t('join.form.name', 'Nome completo')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <FormInput
              label={t('join.form.email', 'E-mail')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <FormInput
              label={t('join.form.phone', 'Telefone')}
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <CaptchaChallenge onChange={setCaptcha} />
            <FormButton
              type="submit"
              variant="link"
              disabled={loading || !name}
            >
              {loading
                ? t('join.form.submitting', 'A registar…')
                : t('join.form.submit', 'Registar')}
            </FormButton>
            {error && (
              <p className="text-sm text-red-600 text-center">
                {error.message}
              </p>
            )}
          </>
        )}

        {success && (
          <div className="text-center space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-green-800 font-medium mb-2">
                {t('join.success_title', 'Cadastro realizado!')}
              </h3>
              <p className="text-green-700 text-sm">
                {t(
                  'join.success_message',
                  'Verifique o seu email para definir a senha.'
                )}
              </p>
            </div>
          </div>
        )}
      </form>
    </AuthLayout>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- ClientSelfRegister.test.jsx`
Expected: 5 passed

- [ ] **Step 5: Do NOT commit**

---

### Task A4: i18n keys

**Files:**
- Modify: `src/i18n/locales/pt.json`
- Modify: `src/i18n/locales/en.json`

- [ ] **Step 1: Add the `join` namespace to `pt.json`**

Add as a new top-level key (alongside `client_enter`, following the same nesting convention):

```json
"join": {
  "loading": "A carregar…",
  "tenant_not_found": "Link inválido ou salão não encontrado.",
  "subtitle": "Registe-se para aceder à sua área de cliente",
  "form": {
    "name": "Nome completo",
    "email": "E-mail",
    "phone": "Telefone",
    "submit": "Registar",
    "submitting": "A registar…"
  },
  "success_title": "Cadastro realizado!",
  "success_message": "Verifique o seu email para definir a senha.",
  "errors": {
    "rate_limited": "Muitas tentativas. Aguarde uns minutos e tente novamente.",
    "generic": "Ocorreu um erro. Tente novamente."
  }
}
```

- [ ] **Step 2: Add the equivalent English keys to `en.json`**

```json
"join": {
  "loading": "Loading…",
  "tenant_not_found": "Invalid link or salon not found.",
  "subtitle": "Register to access your client area",
  "form": {
    "name": "Full name",
    "email": "Email",
    "phone": "Phone",
    "submit": "Register",
    "submitting": "Registering…"
  },
  "success_title": "Registration complete!",
  "success_message": "Check your email to set your password.",
  "errors": {
    "rate_limited": "Too many attempts. Please wait a few minutes and try again.",
    "generic": "Something went wrong. Please try again."
  }
}
```

- [ ] **Step 3: Verify both JSON files still parse**

Run: `node -e "JSON.parse(require('fs').readFileSync('src/i18n/locales/pt.json'))" && node -e "JSON.parse(require('fs').readFileSync('src/i18n/locales/en.json'))" && echo OK`
Expected: `OK`

- [ ] **Step 4: Do NOT commit**

---

### Task A5: "Copiar link de registo" + "Gerar QR Code" in `Customers.jsx`

**Files:**
- Modify: `src/pages/Customers.jsx`
- Modify: `package.json` (new dependency `qrcode.react`)
- Test: `src/pages/__tests__/Customers.registrationLink.test.jsx` (new)

- [ ] **Step 1: Install the QR code dependency**

Run: `npm install qrcode.react`
Expected: `package.json` and `package-lock.json` updated, no errors.

- [ ] **Step 2: Write the failing test**

```jsx
// src/pages/__tests__/Customers.registrationLink.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Customers from '../Customers';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key }),
}));

jest.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({ slug: 'salao-teste', flags: {}, featureFlagsRaw: {} }),
}));

jest.mock('../../api/customers', () => ({
  fetchCustomers: jest.fn(async () => ({ results: [], count: 0 })),
}));

const writeTextMock = jest.fn(() => Promise.resolve());
Object.assign(navigator, { clipboard: { writeText: writeTextMock } });

describe('Customers registration link', () => {
  beforeEach(() => {
    writeTextMock.mockClear();
  });

  it('copies the /join link to the clipboard', async () => {
    render(
      <MemoryRouter>
        <Customers />
      </MemoryRouter>
    );

    const copyButton = await screen.findByRole('button', {
      name: /copiar link de registo/i,
    });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith(
        expect.stringContaining('/join/salao-teste')
      );
    });
  });

  it('opens a QR code modal for the registration link', async () => {
    render(
      <MemoryRouter>
        <Customers />
      </MemoryRouter>
    );

    const qrButton = await screen.findByRole('button', {
      name: /gerar qr code/i,
    });
    fireEvent.click(qrButton);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });
});
```

Adjust the `../../api/customers` mock path/shape if the real module used by `Customers.jsx` for the initial customer list fetch has a different name/shape — check the top of `src/pages/Customers.jsx` for its actual import before finalizing this mock (this plan assumes a module `src/api/customers.js` exporting `fetchCustomers`; verify and adjust the `jest.mock` path/exports to match exactly, otherwise the page will fail to render for unrelated reasons and both tests will fail with a misleading error).

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -- Customers.registrationLink.test.jsx`
Expected: FAIL — no button with name "Copiar link de registo" or "Gerar QR Code" found.

- [ ] **Step 4: Add the buttons and QR modal**

In `src/pages/Customers.jsx`, add imports near the top:

```jsx
import { QRCodeSVG } from 'qrcode.react';
import { Link2, QrCode } from 'lucide-react';
import Modal from '../components/ui/Modal';
import useToast from '../hooks/useToast';
import ToastContainer from '../components/ui/ToastContainer';
```

Add state near the other `useState` declarations in the component:

```jsx
const [qrModalOpen, setQrModalOpen] = useState(false);
const { toasts, showSuccess, hideToast } = useToast();
```

Compute the registration link (near where `slug` is already destructured from `useTenant()`):

```jsx
const registrationLink = `${window.location.origin}/join/${slug}`;

const handleCopyRegistrationLink = () => {
  navigator.clipboard.writeText(registrationLink);
  showSuccess(
    t('customers.registration_link.copied', 'Link copiado!')
  );
};
```

Add the two buttons in the existing flex row of action buttons (right after the "Importar/Exportar" `Dropdown`, before the filters button — match the existing button style exactly):

```jsx
<button
  type="button"
  onClick={handleCopyRegistrationLink}
  className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-border bg-brand-light/50 px-4 py-2 text-sm font-semibold text-brand-surfaceForeground/80 transition hover:bg-brand-light"
>
  <Link2 className="h-4 w-4" />
  {t('customers.registration_link.copy', 'Copiar link de registo')}
</button>

<button
  type="button"
  onClick={() => setQrModalOpen(true)}
  className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-border bg-brand-light/50 px-4 py-2 text-sm font-semibold text-brand-surfaceForeground/80 transition hover:bg-brand-light"
>
  <QrCode className="h-4 w-4" />
  {t('customers.registration_link.qr', 'Gerar QR Code')}
</button>
```

Add the `Modal` + `ToastContainer` near the other modals rendered at the bottom of the component's JSX (alongside `ImportCustomersModal`, etc.):

```jsx
<Modal
  open={qrModalOpen}
  onClose={() => setQrModalOpen(false)}
  title={t('customers.registration_link.qr_title', 'QR Code de registo')}
>
  <div className="flex flex-col items-center gap-4 p-4">
    <QRCodeSVG value={registrationLink} size={220} />
    <p className="text-xs text-center text-brand-surfaceForeground/60 break-all">
      {registrationLink}
    </p>
  </div>
</Modal>

<ToastContainer toasts={toasts} onClose={hideToast} />
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- Customers.registrationLink.test.jsx`
Expected: 2 passed

- [ ] **Step 6: Run the full existing `Customers` test suite for regressions**

Run: `npm test -- Customers`
Expected: all pre-existing `Customers*` test files still pass (no regressions from the new imports/state).

- [ ] **Step 7: Do NOT commit**

---

## Part B — Captcha challenge for `/join`

### Task B1: `fetchCaptchaChallenge()` API function

**Files:**
- Create: `src/api/captcha.js`
- Test: `src/api/__tests__/captcha.test.js`

- [ ] **Step 1: Write the failing test**

```js
// src/api/__tests__/captcha.test.js
import client from '../client';
import { fetchCaptchaChallenge } from '../captcha';

jest.mock('../client', () => ({
  get: jest.fn(),
}));

describe('fetchCaptchaChallenge', () => {
  it('fetches a new captcha key and image url', async () => {
    client.get.mockResolvedValue({
      data: { key: 'abc123', image_url: '/api/captcha/image/abc123/' },
    });

    const result = await fetchCaptchaChallenge();

    expect(client.get).toHaveBeenCalledWith('captcha/refresh/');
    expect(result).toEqual({
      key: 'abc123',
      image_url: '/api/captcha/image/abc123/',
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- captcha.test.js`
Expected: FAIL with `Cannot find module '../captcha'`

- [ ] **Step 3: Write the implementation**

```js
// src/api/captcha.js
import client from './client';

export async function fetchCaptchaChallenge() {
  const { data } = await client.get('captcha/refresh/');
  return data;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- captcha.test.js`
Expected: 1 passed

- [ ] **Step 5: Do NOT commit**

---

### Task B2: `CaptchaChallenge.jsx` component

**Files:**
- Create: `src/components/security/CaptchaChallenge.jsx`
- Test: `src/components/security/__tests__/CaptchaChallenge.test.jsx`

- [ ] **Step 1: Write the failing tests**

```jsx
// src/components/security/__tests__/CaptchaChallenge.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CaptchaChallenge from '../CaptchaChallenge';
import * as captchaApi from '../../../api/captcha';
import * as captchaPolicy from '../../../utils/captchaPolicy';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key }),
}));

jest.mock('../../../api/captcha');
jest.mock('../../../utils/captchaPolicy');

describe('CaptchaChallenge', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render a challenge when a dev bypass token is present', async () => {
    captchaPolicy.getCaptchaBypassToken.mockReturnValue('dev-bypass-token');
    const onChange = jest.fn();

    render(<CaptchaChallenge onChange={onChange} />);

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith({
        captchaKey: null,
        captchaValue: 'dev-bypass-token',
      });
    });
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(captchaApi.fetchCaptchaChallenge).not.toHaveBeenCalled();
  });

  it('fetches and renders a real challenge when there is no bypass token', async () => {
    captchaPolicy.getCaptchaBypassToken.mockReturnValue(undefined);
    captchaApi.fetchCaptchaChallenge.mockResolvedValue({
      key: 'k1',
      image_url: '/api/captcha/image/k1/',
    });

    render(<CaptchaChallenge onChange={jest.fn()} />);

    const image = await screen.findByRole('img');
    expect(image).toHaveAttribute('src', '/api/captcha/image/k1/');
  });

  it('calls onChange with key and typed value as the user types', async () => {
    captchaPolicy.getCaptchaBypassToken.mockReturnValue(undefined);
    captchaApi.fetchCaptchaChallenge.mockResolvedValue({
      key: 'k1',
      image_url: '/api/captcha/image/k1/',
    });
    const onChange = jest.fn();

    render(<CaptchaChallenge onChange={onChange} />);
    await screen.findByRole('img');

    fireEvent.change(screen.getByLabelText(/captcha/i), {
      target: { value: '4x7q' },
    });

    expect(onChange).toHaveBeenLastCalledWith({
      captchaKey: 'k1',
      captchaValue: '4x7q',
    });
  });

  it('fetches a new challenge when the refresh button is clicked', async () => {
    captchaPolicy.getCaptchaBypassToken.mockReturnValue(undefined);
    captchaApi.fetchCaptchaChallenge
      .mockResolvedValueOnce({ key: 'k1', image_url: '/img/k1/' })
      .mockResolvedValueOnce({ key: 'k2', image_url: '/img/k2/' });

    render(<CaptchaChallenge onChange={jest.fn()} />);
    await screen.findByRole('img');

    fireEvent.click(screen.getByRole('button', { name: /atualizar/i }));

    await waitFor(() => {
      expect(screen.getByRole('img')).toHaveAttribute('src', '/img/k2/');
    });
    expect(captchaApi.fetchCaptchaChallenge).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- CaptchaChallenge.test.jsx`
Expected: FAIL with `Cannot find module '../CaptchaChallenge'`

- [ ] **Step 3: Write the component**

```jsx
// src/components/security/CaptchaChallenge.jsx
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchCaptchaChallenge } from '../../api/captcha';
import { getCaptchaBypassToken } from '../../utils/captchaPolicy';

export default function CaptchaChallenge({ onChange }) {
  const { t } = useTranslation();
  const bypass = getCaptchaBypassToken();
  const [challenge, setChallenge] = useState(null);
  const [value, setValue] = useState('');

  const loadChallenge = useCallback(async () => {
    const data = await fetchCaptchaChallenge();
    setChallenge(data);
    setValue('');
  }, []);

  useEffect(() => {
    if (bypass) {
      onChange?.({ captchaKey: null, captchaValue: bypass });
      return;
    }
    loadChallenge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bypass]);

  if (bypass) {
    return null;
  }

  const handleChange = (e) => {
    const nextValue = e.target.value;
    setValue(nextValue);
    onChange?.({ captchaKey: challenge?.key || null, captchaValue: nextValue });
  };

  return (
    <div className="space-y-2">
      {challenge && (
        <div className="flex items-center gap-2">
          <img
            src={challenge.image_url}
            alt={t('auth.captcha.image_alt', 'Captcha')}
            className="rounded border border-brand-border"
          />
          <button
            type="button"
            onClick={loadChallenge}
            aria-label={t('auth.captcha.refresh', 'Atualizar captcha')}
            className="text-sm text-brand-primary hover:text-brand-primary/80"
          >
            🔄 {t('auth.captcha.refresh', 'Atualizar')}
          </button>
        </div>
      )}
      <label className="block text-sm font-medium text-brand-surfaceForeground">
        {t('auth.captcha.label', 'Digite o texto da imagem (captcha)')}
        <input
          type="text"
          value={value}
          onChange={handleChange}
          className="mt-1 w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm"
        />
      </label>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- CaptchaChallenge.test.jsx`
Expected: 4 passed

- [ ] **Step 5: Do NOT commit**

---

## Part C — Founder/Basic UI fix

### Task C1: `mergePlanAvailability()` pure function

**Files:**
- Create: `src/utils/planAvailability.js`
- Test: `src/utils/__tests__/planAvailability.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// src/utils/__tests__/planAvailability.test.js
import { mergePlanAvailability } from '../planAvailability';

describe('mergePlanAvailability', () => {
  const planOptions = [
    { code: 'basic', name: 'TimelyOne', price: '€29', highlights: ['a', 'b'] },
    { code: 'founder', name: 'Founder', price: '€15', highlights: ['c'] },
  ];

  it('merges backend availability fields into the matching plan option', () => {
    const availablePlans = [
      { plan_code: 'basic', is_available: false, is_current: false, can_upgrade: true },
      { plan_code: 'founder', is_available: true, is_current: false, can_upgrade: false },
    ];

    const result = mergePlanAvailability(planOptions, availablePlans);

    expect(result).toEqual([
      {
        code: 'basic',
        name: 'TimelyOne',
        price: '€29',
        highlights: ['a', 'b'],
        plan_code: 'basic',
        is_available: false,
        is_current: false,
        can_upgrade: true,
      },
      {
        code: 'founder',
        name: 'Founder',
        price: '€15',
        highlights: ['c'],
        plan_code: 'founder',
        is_available: true,
        is_current: false,
        can_upgrade: false,
      },
    ]);
  });

  it('omits plan options that the backend does not return', () => {
    const availablePlans = [
      { plan_code: 'basic', is_available: true, is_current: true, can_upgrade: false },
    ];

    const result = mergePlanAvailability(planOptions, availablePlans);

    expect(result).toHaveLength(1);
    expect(result[0].code).toBe('basic');
  });

  it('returns an empty array when availablePlans is null or undefined', () => {
    expect(mergePlanAvailability(planOptions, null)).toEqual([]);
    expect(mergePlanAvailability(planOptions, undefined)).toEqual([]);
  });

  it('returns an empty array when availablePlans is an empty array', () => {
    expect(mergePlanAvailability(planOptions, [])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- planAvailability.test.js`
Expected: FAIL with `Cannot find module '../planAvailability'`

- [ ] **Step 3: Write the implementation**

```js
// src/utils/planAvailability.js
export function mergePlanAvailability(planOptions, availablePlans) {
  const byCode = new Map(
    (availablePlans || []).map((p) => [p.plan_code, p])
  );
  return (planOptions || [])
    .filter((option) => byCode.has(option.code))
    .map((option) => ({ ...option, ...byCode.get(option.code) }));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- planAvailability.test.js`
Expected: 4 passed

- [ ] **Step 5: Do NOT commit**

---

### Task C2: Apply to `Plans.jsx`

**Files:**
- Modify: `src/pages/Plans.jsx`
- Test: `src/pages/__tests__/Plans.test.jsx` (new — no pre-existing test file for this page)

- [ ] **Step 1: Write the failing tests**

```jsx
// src/pages/__tests__/Plans.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Plans from '../Plans';
import * as billingApi from '../../api/billing';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key }),
}));

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));

jest.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({
    plan: { tier: 'basic', name: 'Basic' },
    slug: 'aurora',
    refetch: jest.fn(),
  }),
}));

let mockOverview;
jest.mock('../../hooks/useBillingOverview', () => () => ({
  overview: mockOverview,
  loading: false,
  refresh: jest.fn(),
}));

jest.mock('../../api/billing', () => ({
  PLAN_OPTIONS: [
    { code: 'basic', name: 'TimelyOne', price: '€29', highlights: [] },
    { code: 'founder', name: 'Founder', price: '€15', highlights: [] },
  ],
  createCheckoutSession: jest.fn(),
  createBillingPortalSession: jest.fn(),
}));

describe('Plans', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('disables the checkout button when the selected plan is not available', async () => {
    mockOverview = {
      available_plans: [
        { plan_code: 'basic', is_available: false, is_current: false, can_upgrade: true },
        { plan_code: 'founder', is_available: true, is_current: false, can_upgrade: false },
      ],
    };

    render(
      <MemoryRouter>
        <Plans />
      </MemoryRouter>
    );

    const continueBtn = await screen.findByText(/Continuar para checkout/i);
    expect(continueBtn.closest('button')).toBeDisabled();
  });

  it('enables the checkout button when the selected plan is available', async () => {
    mockOverview = {
      available_plans: [
        { plan_code: 'basic', is_available: true, is_current: false, can_upgrade: true },
      ],
    };

    render(
      <MemoryRouter>
        <Plans />
      </MemoryRouter>
    );

    const continueBtn = await screen.findByText(/Continuar para checkout/i);
    expect(continueBtn.closest('button')).not.toBeDisabled();
  });

  it('does not render a plan the backend omits from available_plans', async () => {
    mockOverview = {
      available_plans: [
        { plan_code: 'basic', is_available: true, is_current: true, can_upgrade: false },
      ],
    };

    render(
      <MemoryRouter>
        <Plans />
      </MemoryRouter>
    );

    await screen.findByText('TimelyOne');
    expect(screen.queryByText('Founder')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- Plans.test.jsx`
Expected: FAIL — `selected` defaults to `'basic'`, plans list currently comes from the static `checkFounderAvailability`-driven filter, not from `overview.available_plans`, so the disabled-state assertions fail.

- [ ] **Step 3: Update `Plans.jsx`**

Remove the import and the two related `useEffect`s:

```jsx
// REMOVE this import:
import { checkFounderAvailability } from '../api/users';

// REMOVE this state:
const [founderAvailable, setFounderAvailable] = useState(false);

// REMOVE these two useEffects entirely:
useEffect(() => {
  checkFounderAvailability()
    .then(({ available }) => {
      console.log('[Plans] Founder availability check:', { available });
      setFounderAvailable(available);
    })
    .catch((err) => {
      console.error('[Plans] Founder availability error:', err);
      setFounderAvailable(false);
    });
}, []);

useEffect(() => {
  if (founderAvailable) {
    console.log('[Plans] Showing Founder plan (available)');
    setPlans(PLAN_OPTIONS.filter((p) => p.code !== 'basic'));
  } else {
    console.log('[Plans] Hiding Founder plan (not available)');
    setPlans(PLAN_OPTIONS.filter((p) => p.code !== 'founder'));
  }
}, [founderAvailable]);
```

Add the import:

```jsx
import { mergePlanAvailability } from '../utils/planAvailability';
```

Replace the `plans` state declaration:

```jsx
// BEFORE:
const [plans, setPlans] = useState(() =>
  PLAN_OPTIONS.filter((p) => p.code !== 'founder')
);

// AFTER:
const plans = useMemo(
  () => mergePlanAvailability(PLAN_OPTIONS, overview?.available_plans),
  [overview?.available_plans]
);
```

Add `useMemo` to the existing React import at the top of the file:

```jsx
import { useCallback, useState, useEffect, useMemo } from 'react';
```

Update the checkout button's `disabled` prop (both the inline button and the one inside the confirmation `Modal`'s footer) to also check availability:

```jsx
// Find the selected plan's availability once, near confirmCheckout/onContinue:
const selectedPlan = plans.find((p) => p.code === selected);

// Inline "Continuar para checkout" button — add `|| !selectedPlan?.is_available`:
disabled={loading || !isAuthenticated || !selectedPlan?.is_available}

// Modal footer "Continuar para checkout" button — same addition:
disabled={loading || !isAuthenticated || !selectedPlan?.is_available}
```

Do NOT change the "Gerir plano" button (`onManage`) — that one is unrelated to plan selection availability.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- Plans.test.jsx`
Expected: 3 passed

- [ ] **Step 5: Do NOT commit**

---

### Task C3: Apply to `PlanOnboarding.jsx`

**Files:**
- Modify: `src/pages/PlanOnboarding.jsx`
- Modify: `src/pages/__tests__/PlanOnboarding.test.jsx` (pre-existing — mocks `checkFounderAvailability` and returns `overview: null`, both of which must change)

- [ ] **Step 1: Update the pre-existing test file's mocks**

In `src/pages/__tests__/PlanOnboarding.test.jsx`, replace the `useBillingOverview` mock (it currently returns `overview: null`, which after this change means `plans` would be empty and the "Continuar para checkout" text would never render):

```jsx
// BEFORE:
jest.mock('../../hooks/useBillingOverview', () => {
  const state = { overview: null, loading: false, refresh: jest.fn() };
  return () => state;
});

// AFTER:
jest.mock('../../hooks/useBillingOverview', () => {
  const state = {
    overview: {
      available_plans: [
        { plan_code: 'basic', is_available: true, is_current: false, can_upgrade: true },
        { plan_code: 'standard', is_available: true, is_current: false, can_upgrade: true },
        { plan_code: 'pro', is_available: true, is_current: false, can_upgrade: true },
      ],
    },
    loading: false,
    refresh: jest.fn(),
  };
  return () => state;
});
```

Remove the now-unused `checkFounderAvailability` mock and its import:

```jsx
// REMOVE:
import * as usersApi from '../../api/users';
// REMOVE from the '../../api/users' jest.mock block entirely (delete the whole jest.mock call):
jest.mock('../../api/users', () => ({
  checkFounderAvailability: jest.fn(async () => ({
    available: false,
  })),
}));
// REMOVE from beforeEach:
usersApi.checkFounderAvailability.mockResolvedValue({ available: false });
```

- [ ] **Step 2: Run the existing tests to verify they now fail for the right reason**

Run: `npm test -- PlanOnboarding.test.jsx`
Expected: FAIL — component still uses the old `checkFounderAvailability`-based `plans` state, ignoring `overview.available_plans`, so "Continuar para checkout" may not find the expected `basic`/`standard` plan cards, or `createCheckoutSession` assertions fail because `selected` plan isn't in the rendered list.

- [ ] **Step 3: Update `PlanOnboarding.jsx`**

Apply the same edit pattern as Task C2:

```jsx
// REMOVE:
import { checkFounderAvailability } from '../api/users';

// REMOVE this entire useEffect:
useEffect(() => {
  checkFounderAvailability()
    .then(({ available }) => {
      if (available) {
        setPlans(PLAN_OPTIONS.filter((p) => p.code !== 'basic'));
      } else {
        setPlans(PLAN_OPTIONS.filter((p) => p.code !== 'founder'));
      }
    })
    .catch(() => {
      setPlans(PLAN_OPTIONS.filter((p) => p.code !== 'founder'));
    });
}, []);
```

Add the import:

```jsx
import { mergePlanAvailability } from '../utils/planAvailability';
```

Replace the `plans` state:

```jsx
// BEFORE:
const [plans, setPlans] = useState(() =>
  PLAN_OPTIONS.filter((p) => p.code !== 'founder')
);

// AFTER:
const plans = useMemo(
  () => mergePlanAvailability(PLAN_OPTIONS, overview?.available_plans),
  [overview?.available_plans]
);
```

Add `useMemo` to the React import:

```jsx
import { useCallback, useState, useEffect, useMemo } from 'react';
```

Update both "Continuar para checkout" buttons (inline and modal footer) the same way as Task C2:

```jsx
const selectedPlan = plans.find((p) => p.code === selected);
// ...
disabled={loading || !isAuthenticated || !selectedPlan?.is_available}
```

Note: the "select a founder plan card" click handler (`onClick={() => { if (p.code === 'founder') setShowFounderWarning(true); ... }}`) and the founder-warning modal's "Entendi, Continuar" button (which calls `setSelected('founder')`) are unchanged — they only affect which plan is *selected*, not whether checkout is *allowed*; the disabled check above already covers the case where a user selects an unavailable plan.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- PlanOnboarding.test.jsx`
Expected: 3 passed

- [ ] **Step 5: Do NOT commit**

---

### Task C4: Apply to `RegisterCheckout.jsx`

**Files:**
- Modify: `src/pages/RegisterCheckout.jsx`
- Test: `src/pages/__tests__/RegisterCheckout.test.jsx` (new — no pre-existing test file for this page)

- [ ] **Step 1: Write the failing tests**

```jsx
// src/pages/__tests__/RegisterCheckout.test.jsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RegisterCheckout from '../RegisterCheckout';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key, fallback) => fallback || key }),
}));

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));

jest.mock('../../hooks/useTenant', () => ({
  useTenant: () => ({ slug: 'aurora' }),
}));

let mockOverview;
jest.mock('../../hooks/useBillingOverview', () => () => ({
  overview: mockOverview,
  loading: false,
  refresh: jest.fn(),
}));

jest.mock('../../api/billing', () => ({
  PLAN_OPTIONS: [
    { code: 'basic', name: 'TimelyOne', price: '€29', highlights: [] },
    { code: 'founder', name: 'Founder', price: '€15', highlights: [] },
  ],
  createCheckoutSession: jest.fn(),
}));

describe('RegisterCheckout', () => {
  it('disables checkout when the selected plan is unavailable', async () => {
    mockOverview = {
      available_plans: [
        { plan_code: 'basic', is_available: false, is_current: false, can_upgrade: true },
      ],
    };

    render(
      <MemoryRouter>
        <RegisterCheckout />
      </MemoryRouter>
    );

    const continueBtn = await screen.findByText(/Continuar para checkout/i);
    expect(continueBtn.closest('button')).toBeDisabled();
  });

  it('enables checkout when the selected plan is available', async () => {
    mockOverview = {
      available_plans: [
        { plan_code: 'basic', is_available: true, is_current: false, can_upgrade: true },
      ],
    };

    render(
      <MemoryRouter>
        <RegisterCheckout />
      </MemoryRouter>
    );

    const continueBtn = await screen.findByText(/Continuar para checkout/i);
    expect(continueBtn.closest('button')).not.toBeDisabled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- RegisterCheckout.test.jsx`
Expected: FAIL — `RegisterCheckout.jsx` doesn't call `useBillingOverview()` yet, and its `plans` state still comes from `checkFounderAvailability`.

- [ ] **Step 3: Update `RegisterCheckout.jsx`**

Remove the import and effect:

```jsx
// REMOVE:
import { checkFounderAvailability } from '../api/users';

// REMOVE this entire useEffect:
useEffect(() => {
  checkFounderAvailability()
    .then(({ available }) => {
      if (available) {
        setPlans(PLAN_OPTIONS.filter((p) => p.code !== 'basic'));
      } else {
        setPlans(PLAN_OPTIONS.filter((p) => p.code !== 'founder'));
      }
    })
    .catch(() => {
      setPlans(PLAN_OPTIONS.filter((p) => p.code !== 'founder'));
    });
}, []);
```

Add the new imports:

```jsx
import useBillingOverview from '../hooks/useBillingOverview';
import { mergePlanAvailability } from '../utils/planAvailability';
```

Add the hook call (near the other hooks at the top of the component):

```jsx
const { overview } = useBillingOverview({ pollIntervalMs: 3000 });
```

Replace the `plans` state:

```jsx
// BEFORE:
const [plans, setPlans] = useState(() =>
  PLAN_OPTIONS.filter((p) => p.code !== 'founder')
);

// AFTER:
const plans = useMemo(
  () => mergePlanAvailability(PLAN_OPTIONS, overview?.available_plans),
  [overview?.available_plans]
);
```

Ensure `useMemo` is imported from React (check the existing import line — `RegisterCheckout.jsx` currently imports `useCallback, useState, useEffect` — add `useMemo`):

```jsx
import { useCallback, useState, useEffect, useMemo } from 'react';
```

Update the "Continuar para checkout" button's `disabled` prop:

```jsx
const selectedPlan = plans.find((p) => p.code === selected);
// ...
disabled={loading || !isAuthenticated || !selectedPlan?.is_available}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- RegisterCheckout.test.jsx`
Expected: 2 passed

- [ ] **Step 5: Do NOT commit**

---

## Final — Full regression sweep

### Task D1: Run the complete frontend test suite

**Files:** None (verification only)

- [ ] **Step 1: Run all tests**

Run: `npm test 2>&1 | tail -40`
Expected: all test suites pass, 0 failures. Pay particular attention to any other file that imports `checkFounderAvailability` or `PLAN_OPTIONS` from `Plans.jsx`/`PlanOnboarding.jsx`/`RegisterCheckout.jsx` context (there should be none left after Tasks C2-C4 — `Landing.jsx` is unaffected and keeps using both).

- [ ] **Step 2: Verify the production build still succeeds**

Run: `npm run build 2>&1 | tail -30`
Expected: build succeeds with no errors (confirms the new route, new dependency `qrcode.react`, and all new imports resolve correctly).

- [ ] **Step 3: Do NOT commit**

Leave everything staged/modified in the working tree. Report the final test counts to Pablo and stop — he commits and pushes everything himself.

---

## Self-Review Notes (for the plan author, not a task)

- **Spec coverage:** Part 1 (public page, copy-link, QR code, i18n) → Tasks A1-A5. Part 2 (captcha) → Tasks B1-B2. Part 3 (Founder/Basic merge) → Tasks C1-C4, explicitly excluding `Landing.jsx` per the spec's "Fora de escopo" section.
- **Regression risk called out explicitly:** Task C3 documents exactly why the pre-existing `PlanOnboarding.test.jsx` breaks (its `useBillingOverview` mock returns `overview: null`) and how to fix it — found by reading the actual test file before writing the plan, not guessed.
- **Type/name consistency:** `mergePlanAvailability(planOptions, availablePlans)` defined once in Task C1, consumed identically (same signature, same field names `plan_code`/`is_available`/`is_current`/`can_upgrade`) in Tasks C2, C3, C4. `CaptchaChallenge`'s `onChange({ captchaKey, captchaValue })` shape matches exactly what `registerClientPublic()` (Task A1) and `ClientSelfRegister.jsx` (Task A3) expect.
