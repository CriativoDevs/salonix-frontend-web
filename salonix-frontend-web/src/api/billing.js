import client from './client';

export const PLAN_OPTIONS = [
  {
    code: 'founder',
    name: 'Founder',
    price: '€15/mês',
    highlights: [
      'Preço Vitalício',
      'PWA Admin, Staff e Client',
      'Relatórios: Visão Geral',
      '€5 de crédito para comunicações',
    ],
  },
  {
    code: 'basic',
    name: 'Basic',
    price: '€29/mês',
    highlights: [
      'PWA Admin, Staff e Client',
      'Relatórios: Visão Geral',
      '€5 de crédito para comunicações',
    ],
  },
  {
    code: 'standard',
    name: 'Standard',
    price: '€55/mês',
    highlights: [
      'Tudo do Basic',
      'Apps Nativos (Admin / Staff)',
      'Relatórios: Análise do Negócio',
      '€10 de crédito para comunicações',
    ],
  },
  {
    code: 'pro',
    name: 'Pro',
    price: '€95/mês',
    highlights: [
      'Tudo do Standard',
      'Apps Nativos (Client)',
      'Relatórios: Insights Avançados',
      '€15 de crédito para comunicações',
    ],
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
