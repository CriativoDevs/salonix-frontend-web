import client from './client';

export const PLAN_OPTIONS = [
  {
    code: 'basic',
    name: 'Basic – 29€ / mês',
    price: '€29/mês',
    highlights: [
      'PWA Admin/Manager/Staff',
      'Relatórios básicos',
      'Email e web push',
    ],
  },
  {
    code: 'standard',
    name: 'Standard – 55€ / mês',
    price: '€55/mês',
    highlights: ['Tudo do Basic', 'PWA Cliente', '€5 de crédito incluído'],
  },
  {
    code: 'pro',
    name: 'Pro – 95€ / mês',
    price: '€95/mês',
    highlights: [
      'Tudo do Standard',
      'White-label + domínio personalizado',
      '€25 de crédito incluído',
    ],
  },
  {
    code: 'enterprise',
    name: 'Enterprise – 199€ / mês',
    price: '€199/mês',
    highlights: ['Apps nativas iOS/Android', 'Integrações sob demanda'],
  },
];

export async function createCheckoutSession(planCode, options = {}) {
  const { slug } = options || {};

  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }

  // Problema 3: Removendo fallbacks em cascata para garantir que erros reais do backend apareçam
  // e usem o endpoint correto: payments/stripe/create-checkout-session/
  const response = await client.post(
    'payments/stripe/create-checkout-session/',
    { plan: planCode },
    { headers, params }
  );

  const checkoutUrl = response?.data?.checkout_url || response?.data?.url;
  if (!checkoutUrl) {
    console.error('[BillingAPI] Checkout URL missing in response:', response?.data);
    throw new Error('Checkout URL not found in response');
  }
  return { url: checkoutUrl };
}

export async function createBillingPortalSession(options = {}) {
  const { slug } = options || {};

  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }

  const response = await client.post(
    'payments/stripe/billing-portal/',
    {},
    { headers, params }
  );
  const portalUrl = response?.data?.portal_url || response?.data?.url;
  if (!portalUrl) {
    throw new Error('Portal URL not found in response');
  }
  return { url: portalUrl };
}
