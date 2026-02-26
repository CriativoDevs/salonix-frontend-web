import client from './client';

export const PLAN_OPTIONS = [
  {
    code: 'basic',
    name: 'Basic',
    price: '€29',
    price_annual: '€290',
    highlights: [
      'PWA para Admin e Clientes',
      'Relatórios Básicos e Visão Geral',
      'Notificações por Email e Web Push',
      '€5 de crédito para comunicações',
    ],
  },
  {
    code: 'founder',
    name: 'Founder',
    price: '€15',
    price_annual: '€150',
    highlights: [
      'Funcionalidades do Plano Basic',
      'Preço Vitalício Garantido',
      'PWA para Admin e Clientes',
      '€5 de crédito para comunicações',
    ],
  },
  {
    code: 'pro',
    name: 'Pro',
    price: '€55',
    price_annual: '€550',
    highlights: [
      'Tudo do Basic',
      'Relatórios Avançados e Insights',
      'Apps Nativos (Admin / Staff) - (Cliente - em breve)',
      '€15 de crédito para comunicações',
    ],
  },
];

export async function createCheckoutSession(planCode, options = {}) {
  const { slug, interval = 'monthly' } = options || {};

  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }

  const response = await client.post(
    'payments/stripe/create-checkout-session/',
    { plan: planCode, interval },
    { headers, params }
  );

  const checkoutUrl = response?.data?.checkout_url || response?.data?.url;
  if (!checkoutUrl) {
    console.error(
      '[BillingAPI] Checkout URL missing in response:',
      response?.data
    );
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
