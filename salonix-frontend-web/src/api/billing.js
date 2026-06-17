import client from './client';

// FEW-PLANS-01 (#320): plano único — o Pro foi descontinuado (BE-PLANS-01/#481).
// O UI mostra Founder enquanto houver vagas; caso contrário, o plano completo (code basic).
export const PLAN_OPTIONS = [
  {
    code: 'basic',
    name: 'TimelyOne',
    price: '€29',
    price_annual: '€290',
    highlights: [
      'Agenda inteligente com agendamentos online ilimitados',
      'Profissionais e serviços ilimitados',
      'Relatórios completos com insights do negócio',
      'Lembretes automáticos por email, web push e SMS',
      '€5 de crédito mensal para comunicações',
      'White-label: a sua marca no portal dos clientes (em breve)',
      'PWA instalável para equipa e clientes',
      'App nativo iOS e Android para a sua equipa (já disponível)',
      'App nativo para os seus clientes (em breve — já incluído no plano)',
    ],
  },
  {
    code: 'founder',
    name: 'Founder',
    price: '€15',
    price_annual: '€150',
    highlights: [
      'Agenda inteligente com agendamentos online ilimitados',
      'Profissionais e serviços ilimitados',
      'Relatórios completos com insights do negócio',
      'Lembretes automáticos por email, web push e SMS',
      '€2 de crédito mensal para comunicações',
      'White-label: a sua marca no portal dos clientes (em breve)',
      'PWA instalável para equipa e clientes',
      'App nativo iOS e Android para a sua equipa (já disponível)',
      'App nativo para os seus clientes (em breve — já incluído no plano)',
      'Preço de €15/mês garantido para sempre',
      'Apoio direto da equipa fundadora',
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
