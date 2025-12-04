import client from './client';
import { getEnvFlag, getEnvVar } from '../utils/env';

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
  const billingMockEnabled = getEnvFlag('VITE_BILLING_MOCK');
  const { slug } = options || {};

  console.log(
    '[Billing] env VITE_BILLING_MOCK=',
    getEnvVar('VITE_BILLING_MOCK')
  );
  console.log(
    '[Billing] createCheckoutSession mock=',
    billingMockEnabled,
    'plan=',
    planCode
  );

  if (billingMockEnabled) {
    // Simula latência
    await new Promise((r) => setTimeout(r, 300));
    return { url: `/checkout/mock?plan=${encodeURIComponent(planCode)}` };
  }

  const headers = {};
  const params = {};
  if (slug) {
    headers['X-Tenant-Slug'] = slug;
    params.tenant = slug;
  }

  let response;
  try {
    response = await client.post(
      'payments/stripe/create-checkout-session/',
      { plan: planCode },
      { headers, params }
    );
  } catch (err) {
    if (err?.response?.status === 404) {
      try {
        response = await client.post(
          'payments/checkout/',
          { plan: planCode },
          { headers, params }
        );
      } catch (err2) {
        if (err2?.response?.status === 404) {
          response = await client.post(
            'payments/checkout/session/',
            { plan: planCode },
            { headers, params }
          );
        } else {
          throw err2;
        }
      }
    } else {
      throw err;
    }
  }
  // Backend esperado: { checkout_url }
  const checkoutUrl = response?.data?.checkout_url || response?.data?.url;
  if (!checkoutUrl) {
    console.warn(
      '[Billing] checkout_url ausente na resposta. Retornando mock.'
    );
    return { url: `/checkout/mock?plan=${encodeURIComponent(planCode)}` };
  }
  return { url: checkoutUrl };
}

export async function createBillingPortalSession(options = {}) {
  const billingMockEnabled = getEnvFlag('VITE_BILLING_MOCK');
  const { slug } = options || {};

  if (billingMockEnabled) {
    await new Promise((r) => setTimeout(r, 200));
    return { url: '/billing/mock/portal' };
  }

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
    console.warn('[Billing] portal_url ausente na resposta.');
    return { url: '/billing/mock/portal' };
  }
  return { url: portalUrl };
}
