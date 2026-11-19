import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Settings from '../Settings';
import { useTenant } from '../../hooks/useTenant';
import { updateTenantBranding, fetchTenantBusinessHours } from '../../api/tenant';

const tMock = (key, defaultValueOrOptions) => {
  if (typeof defaultValueOrOptions === 'string') {
    return defaultValueOrOptions;
  }
  if (
    defaultValueOrOptions &&
    typeof defaultValueOrOptions === 'object' &&
    typeof defaultValueOrOptions.defaultValue === 'string'
  ) {
    return defaultValueOrOptions.defaultValue;
  }
  return key;
};

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: tMock, i18n: { language: 'pt' } }),
}));

jest.mock('../../layouts/FullPageLayout', () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));

jest.mock('../../hooks/useTenant', () => ({
  useTenant: jest.fn(),
}));

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { email: 'owner@aurora.com', full_name: 'Owner Aurora', role: 'owner' },
    logout: jest.fn(),
  }),
}));

jest.mock('../../hooks/useCreditBalance', () => ({
  __esModule: true,
  default: () => ({
    balance: { current_balance: 10 },
    loading: false,
    error: null,
    refresh: jest.fn(),
  }),
}));

jest.mock('../../hooks/useBillingOverview', () => ({
  __esModule: true,
  default: () => ({ overview: null, loading: false, refresh: jest.fn() }),
}));

jest.mock('../../hooks/useFeatureLock', () => ({
  __esModule: true,
  default: () => ({ isLocked: false, requiredTier: null }),
}));

jest.mock('../../hooks/useCreditGate', () => ({
  __esModule: true,
  default: () => ({
    balance: 10,
    loading: false,
    checkCredits: () => true,
    getCost: () => 1,
  }),
}));

jest.mock('../../hooks/useCreditPurchase', () => ({
  __esModule: true,
  default: () => ({
    packages: [],
    loadingPackages: false,
    purchaseLoading: false,
    error: null,
    buyPackage: jest.fn(),
  }),
}));

jest.mock('../../api/tenantNotifications', () => ({
  updateTenantNotifications: jest.fn(),
}));

jest.mock('../../api/billingOverview', () => ({
  __esModule: true,
  default: { updateAutoRenewal: jest.fn() },
}));

jest.mock('../../components/security/PlanGate', () => ({
  __esModule: true,
  default: ({ children }) => <>{children}</>,
}));

jest.mock('../../components/security/FeatureGate', () => ({
  __esModule: true,
  default: ({ children }) => <>{children}</>,
}));

jest.mock('../../components/security/UpgradePrompt', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../../components/credits/CreditPurchaseModal', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../../components/credits/CreditBlockModal', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../../components/settings/CreditSettings', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../../components/settings/BulkImportExportPanel', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../../api/tenant', () => ({
  updateTenantBranding: jest.fn(),
  updateTenantAutoInvite: jest.fn(),
  updateTenantModules: jest.fn(),
  updateTenantAutoGenerateSlots: jest.fn(),
  updateTenantContact: jest.fn(),
  fetchTenantBusinessHours: jest.fn(),
  updateTenantBusinessHours: jest.fn(),
}));

function renderSettings() {
  return render(
    <MemoryRouter>
      <Settings />
    </MemoryRouter>
  );
}

function tenantMock(extra = {}) {
  return {
    tenant: { business_type: 'salon', ...extra },
    plan: 'basic',
    modules: {},
    channels: {},
    flags: {},
    featureFlagsRaw: {},
    profile: {},
    branding: {},
    loading: false,
    error: null,
    refetch: jest.fn().mockResolvedValue(true),
  };
}

describe('Settings — tipo de negócio (FEW-BUSINESS-TYPE-01)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchTenantBusinessHours.mockResolvedValue([]);
    updateTenantBranding.mockResolvedValue({});
  });

  it('mostra o tipo atual do tenant e as 8 opções', async () => {
    useTenant.mockReturnValue(tenantMock({ business_type: 'psychology' }));
    renderSettings();
    fireEvent.click(screen.getByText('settings.tabs.branding'));

    const select = await screen.findByLabelText('Tipo de negócio');
    expect(select).toHaveValue('psychology');
    expect(select.querySelectorAll('option')).toHaveLength(8);
  });

  it('salva o tipo escolhido via updateTenantBranding', async () => {
    useTenant.mockReturnValue(tenantMock());
    renderSettings();
    fireEvent.click(screen.getByText('settings.tabs.branding'));

    const select = await screen.findByLabelText('Tipo de negócio');
    fireEvent.change(select, { target: { value: 'tattoo' } });
    fireEvent.click(screen.getByText('settings.save'));

    await waitFor(() =>
      expect(updateTenantBranding).toHaveBeenCalledWith(
        expect.objectContaining({ businessType: 'tattoo' })
      )
    );
  });
});
