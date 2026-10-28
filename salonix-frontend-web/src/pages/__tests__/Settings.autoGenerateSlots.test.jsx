import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Settings from '../Settings';
import { useTenant } from '../../hooks/useTenant';
import {
  updateTenantAutoGenerateSlots,
  fetchTenantBusinessHours,
} from '../../api/tenant';

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

async function goToGeneralTab() {
  fireEvent.click(screen.getByText('settings.tabs.general'));
  await waitFor(() =>
    expect(
      screen.getByText('Gerar horários automaticamente todo mês')
    ).toBeInTheDocument()
  );
}

describe('Settings — geração automática de horários (FEW-SLOTS-04)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchTenantBusinessHours.mockResolvedValue([
      {
        is_active: true,
        day_of_week: 1,
        start_time: '09:00:00',
        end_time: '18:00:00',
      },
    ]);
  });

  it('exibe o toggle desligado quando o tenant não tem a flag ativa', async () => {
    useTenant.mockReturnValue({
      tenant: { auto_generate_slots_enabled: false },
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
    });

    renderSettings();
    await goToGeneralTab();

    const toggle = screen.getByRole('switch', {
      name: 'Alternar geração automática de horários',
    });
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });

  it('liga o toggle, chama a API e atualiza o tenant', async () => {
    const refetch = jest.fn().mockResolvedValue(true);
    useTenant.mockReturnValue({
      tenant: { auto_generate_slots_enabled: false },
      plan: 'basic',
      modules: {},
      channels: {},
      flags: {},
      featureFlagsRaw: {},
      profile: {},
      branding: {},
      loading: false,
      error: null,
      refetch,
    });
    updateTenantAutoGenerateSlots.mockResolvedValue({
      auto_generate_slots_enabled: true,
    });

    renderSettings();
    await goToGeneralTab();

    const toggle = screen.getByRole('switch', {
      name: 'Alternar geração automática de horários',
    });
    fireEvent.click(toggle);

    await waitFor(() =>
      expect(updateTenantAutoGenerateSlots).toHaveBeenCalledWith(true)
    );
    await waitFor(() => expect(toggle).toHaveAttribute('aria-checked', 'true'));
    await waitFor(() => expect(refetch).toHaveBeenCalled());
    expect(
      screen.getByText('Geração automática de horários habilitada.')
    ).toBeInTheDocument();
  });

  it('reverte o toggle e mostra a mensagem de erro 400 quando falta horário de funcionamento', async () => {
    useTenant.mockReturnValue({
      tenant: { auto_generate_slots_enabled: false },
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
    });
    const errorMessage =
      'Configure o horário de funcionamento antes de ativar a geração automática.';
    updateTenantAutoGenerateSlots.mockRejectedValue({
      response: {
        status: 400,
        data: { detail: errorMessage },
      },
    });

    renderSettings();
    await goToGeneralTab();

    const toggle = screen.getByRole('switch', {
      name: 'Alternar geração automática de horários',
    });
    fireEvent.click(toggle);

    await waitFor(() =>
      expect(updateTenantAutoGenerateSlots).toHaveBeenCalledWith(true)
    );
    await waitFor(() =>
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    );
    expect(toggle).toHaveAttribute('aria-checked', 'false');
  });
});
