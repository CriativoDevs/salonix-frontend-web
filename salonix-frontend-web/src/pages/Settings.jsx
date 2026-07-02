import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { LockIcon } from 'lucide-react';
import FullPageLayout from '../layouts/FullPageLayout';
import BulkImportExportPanel from '../components/settings/BulkImportExportPanel';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import { useAuth } from '../hooks/useAuth';
import { useTenant } from '../hooks/useTenant';
import RoleProtectedRoute from '../routes/RoleProtectedRoute';
import useCreditBalance from '../hooks/useCreditBalance';
import { updateTenantNotifications } from '../api/tenantNotifications';

import { toast } from 'react-toastify';
import billingOverviewApi from '../api/billingOverview';
import useBillingOverview from '../hooks/useBillingOverview';
import FeatureGate from '../components/security/FeatureGate';
import PlanGate from '../components/security/PlanGate';
import UpgradePrompt from '../components/security/UpgradePrompt';
import useFeatureLock from '../hooks/useFeatureLock';
import { DEFAULT_TENANT_META, resolveTenantAssetUrl } from '../utils/tenant';
import { parseApiError } from '../utils/apiError';
import {
  updateTenantBranding,
  updateTenantAutoInvite,
  updateTenantModules,
  updateTenantContact,
  fetchTenantBusinessHours,
  updateTenantBusinessHours,
} from '../api/tenant';
import FormInput from '../components/ui/FormInput';
import { TENANT_FEATURE_REQUIREMENTS } from '../constants/tenantFeatures';
import {
  resolvePlanModules,
  resolvePlanName,
  resolvePlanTier,
  comparePlanTiers,
} from '../utils/tenantPlan';
import CreditPurchaseModal from '../components/credits/CreditPurchaseModal';
import CreditBlockModal from '../components/credits/CreditBlockModal';
import CreditSettings from '../components/settings/CreditSettings';
import useCreditGate from '../hooks/useCreditGate';
// Checkout de créditos via sessão hospedada da Stripe (sem Elements)

const TAB_ITEMS = [
  { id: 'branding', label: 'settings.tabs.branding', icon: '🖼️' },
  { id: 'general', label: 'settings.tabs.general', icon: '⚙️' },
  { id: 'notifications', label: 'settings.tabs.notifications', icon: '🔔' },
  { id: 'credits', label: 'settings.tabs.credits', icon: '💳' },
  { id: 'account', label: 'settings.tabs.account', icon: '👤' },
  // { id: 'billing', label: 'settings.tabs.billing', icon: '💳' },
  // { id: 'business', label: 'settings.tabs.business', icon: '🏢' }, // Ocultado conforme solicitação
  { id: 'data', label: 'settings.tabs.data', icon: '📊' },
];

const MODULE_CONFIG = {
  reports: {
    labelKey: 'settings.modules.reports',
    defaultLabel: 'Relatórios avançados',
    flagKey: 'enableReports',
    rawKey: 'reports_enabled',
  },
  pwa_admin: {
    labelKey: 'settings.modules.pwa_admin',
    defaultLabel: 'Painel administrativo (PWA)',
    flagKey: 'enableAdminPwa',
    rawKey: 'pwa_admin_enabled',
  },
  pwa_client: {
    labelKey: 'settings.modules.pwa_client',
    defaultLabel: 'PWA Cliente',
    flagKey: 'enableCustomerPwa',
    rawKey: 'pwa_client_enabled',
  },
  rn_admin: {
    labelKey: 'settings.modules.rn_admin',
    defaultLabel: 'App Admin (React Native)',
    flagKey: 'enableNativeAdmin',
    rawKey: 'rn_admin_enabled',
  },
  rn_client: {
    labelKey: 'settings.modules.rn_client',
    defaultLabel: 'App Cliente (React Native)',
    flagKey: 'enableNativeClient',
    rawKey: 'rn_client_enabled',
  },
};

const MODULE_REQUIREMENTS = {
  reports: 'enableReports',
  pwa_client: 'enableCustomerPwa',
};

const resolveModuleLabel = (moduleKey, t) => {
  const cfg = MODULE_CONFIG[moduleKey];
  if (!cfg) return moduleKey;
  return t(cfg.labelKey, cfg.defaultLabel);
};

const CHANNEL_CONFIG = [
  { key: 'email', defaultLabel: 'Email' },
  { key: 'sms', defaultLabel: 'SMS' },
  { key: 'whatsapp', defaultLabel: 'WhatsApp' },
  { key: 'push_web', defaultLabel: 'Web Push' },
  { key: 'push_mobile', defaultLabel: 'Mobile Push' },
];

const WEEKDAY_KEYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const DAY_KEY_TO_DOW = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 0,
};

const DOW_TO_DAY_KEY = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
};

function normalizeWorkingHoursFromApi(items) {
  const base = { ...DEFAULT_TENANT_META.profile.workingHours };
  if (!Array.isArray(items)) return base;

  const next = { ...base };
  items.forEach((item) => {
    const dayKey = DOW_TO_DAY_KEY[item?.day_of_week];
    if (!dayKey) return;

    const fallbackDay = base[dayKey] || {
      open: '09:00',
      close: '18:00',
      closed: false,
    };

    const startTime = String(item?.start_time || fallbackDay.open).slice(0, 5);
    const endTime = String(item?.end_time || fallbackDay.close).slice(0, 5);

    next[dayKey] = {
      ...fallbackDay,
      open: startTime,
      close: endTime,
      closed: !item?.is_active,
    };
  });

  return next;
}

function buildBusinessHoursPayload(workingHours = {}) {
  return WEEKDAY_KEYS.map((dayKey) => {
    const fallbackDay = DEFAULT_TENANT_META.profile.workingHours?.[dayKey] || {
      open: '09:00',
      close: '18:00',
      closed: false,
    };
    const day = workingHours[dayKey] || fallbackDay;

    return {
      day_of_week: DAY_KEY_TO_DOW[dayKey],
      start_time: String(day?.open || fallbackDay.open).slice(0, 5),
      end_time: String(day?.close || fallbackDay.close).slice(0, 5),
      is_active: !day?.closed,
    };
  });
}

function validateWorkingHours(workingHours, t) {
  const errors = {};

  WEEKDAY_KEYS.forEach((dayKey) => {
    const fallbackDay = DEFAULT_TENANT_META.profile.workingHours?.[dayKey] || {
      open: '09:00',
      close: '18:00',
      closed: false,
    };
    const day = workingHours?.[dayKey] || fallbackDay;

    if (day?.closed) return;

    const open = String(day?.open || '').trim();
    const close = String(day?.close || '').trim();

    if (!open) {
      errors[dayKey] = t(
        'settings.general.working_hours_error_start_required',
        'Hora de início obrigatória para dia ativo.'
      );
      return;
    }

    if (!close) {
      errors[dayKey] = t(
        'settings.general.working_hours_error_end_required',
        'Hora de fim obrigatória para dia ativo.'
      );
      return;
    }

    if (close <= open) {
      errors[dayKey] = t(
        'settings.general.working_hours_error_range',
        'Hora de fim deve ser maior que a hora de início.'
      );
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

function formatPostalCodePT(value) {
  const digits = String(value || '')
    .replace(/\D+/g, '')
    .slice(0, 7);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4, 7)}`;
}

function buildInitialSettings(profile, channels, branding, tenant) {
  const safeProfile = { ...DEFAULT_TENANT_META.profile, ...(profile || {}) };
  const safeChannels = { ...DEFAULT_TENANT_META.channels, ...(channels || {}) };
  const safeBranding = { ...DEFAULT_TENANT_META.branding, ...(branding || {}) };

  return {
    general: {
      businessName: safeProfile.businessName || '',
      email: safeProfile.email || '',
      phone: safeProfile.phone || '',
      address: safeProfile.address || '',
      timezone: safeProfile.timezone || 'Europe/Lisbon',
      language: safeProfile.language || 'pt',
    },
    notifications: {
      emailNotifications: Boolean(safeChannels.email),
      smsNotifications: Boolean(safeChannels.sms),
      appointmentReminders: Boolean(safeChannels.email || safeChannels.sms),
      marketingEmails: Boolean(safeProfile.marketingEmails),
    },
    business: {
      workingHours: {
        ...DEFAULT_TENANT_META.profile.workingHours,
        ...(safeProfile.workingHours || {}),
      },
      appointmentDuration:
        safeProfile.appointmentDuration ??
        DEFAULT_TENANT_META.profile.appointmentDuration,
      bufferTime:
        safeProfile.bufferTime ?? DEFAULT_TENANT_META.profile.bufferTime,
    },
    branding: {
      logoUrl: safeBranding.logoUrl || '',
    },
    brandingAddress: {
      street: tenant?.address_street || '',
      number: tenant?.address_number || '',
      complement: tenant?.address_complement || '',
      neighborhood: tenant?.address_neighborhood || '',
      city: tenant?.address_city || '',
      state: tenant?.address_state || '',
      zip: tenant?.address_zip || '',
      country: tenant?.address_country || '',
    },
  };
}

function Settings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const {
    tenant,
    tenantSlug,
    plan,
    modules,
    channels,
    flags,
    featureFlagsRaw,
    profile,
    branding,
    loading: tenantLoading,
    error: tenantError,
    refetch,
  } = useTenant();
  const [activeTab, setActiveTab] = useState('branding');
  const {
    balance,
    loading: creditLoading,
    error: creditError,
    refresh: refreshCredits,
  } = useCreditBalance();
  const { overview: billingOverview, refresh: refreshOverview } =
    useBillingOverview();
  // SSE desativado: atualização manual via badge (CreditBadge)

  // Verificações de permissões por feature
  const { isLocked: pwaClientLocked, requiredTier: pwaClientTier } =
    useFeatureLock('enableCustomerPwa');

  const initialSettings = useMemo(
    () => buildInitialSettings(profile, channels, branding, tenant),
    [profile, channels, branding, tenant]
  );

  const [settings, setSettings] = useState(initialSettings);
  const [brandingFile, setBrandingFile] = useState(null);
  const [brandingPreview, setBrandingPreview] = useState('');
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [brandingError, setBrandingError] = useState(null);
  const [brandingSuccess, setBrandingSuccess] = useState('');
  const [autoInviteEnabled, setAutoInviteEnabled] = useState(
    Boolean(tenant?.auto_invite_enabled)
  );
  const [autoInviteSaving, setAutoInviteSaving] = useState(false);
  const [pwaClientEnabled, setPwaClientEnabled] = useState(false);
  const [pwaClientSaving, setPwaClientSaving] = useState(false);
  const [pwaClientError, setPwaClientError] = useState(null);
  const [pwaClientSuccess, setPwaClientSuccess] = useState('');
  const [notifRawOverrides, setNotifRawOverrides] = useState({});
  const [generalSaving, setGeneralSaving] = useState(false);
  const [generalError, setGeneralError] = useState(null);
  const [generalSuccess, setGeneralSuccess] = useState('');
  const [businessHoursLoading, setBusinessHoursLoading] = useState(false);
  const [businessHoursSaving, setBusinessHoursSaving] = useState(false);
  const [businessHoursError, setBusinessHoursError] = useState(null);
  const [businessHoursSuccess, setBusinessHoursSuccess] = useState('');
  const [businessHoursFieldErrors, setBusinessHoursFieldErrors] = useState({});
  const [businessHoursLoadedSlug, setBusinessHoursLoadedSlug] = useState(null);

  useEffect(() => {
    setSettings((previous) => {
      const preserveWorkingHours =
        businessHoursLoadedSlug && businessHoursLoadedSlug === tenant?.slug;

      return {
        ...initialSettings,
        business: {
          ...(initialSettings.business || {}),
          workingHours: preserveWorkingHours
            ? previous?.business?.workingHours ||
              initialSettings.business?.workingHours
            : initialSettings.business?.workingHours,
        },
      };
    });
    setBrandingFile(null);
    setBrandingSuccess('');
    setBrandingError(null);
  }, [initialSettings, businessHoursLoadedSlug, tenant?.slug]);

  useEffect(() => {
    setAutoInviteEnabled(Boolean(tenant?.auto_invite_enabled));
  }, [tenant?.auto_invite_enabled]);

  useEffect(() => {
    const initial = Boolean(
      (tenant && tenant.pwa_client_enabled) ??
        (flags && flags.enableCustomerPwa)
    );
    setPwaClientEnabled(initial);
  }, [tenant, flags]);

  useEffect(() => {
    if (brandingFile) {
      const url = URL.createObjectURL(brandingFile);
      setBrandingPreview(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
    const preview =
      resolveTenantAssetUrl(settings.branding.logoUrl) ||
      resolveTenantAssetUrl(branding?.logoUrl) ||
      '';
    setBrandingPreview(preview);
    return undefined;
  }, [brandingFile, settings.branding.logoUrl, branding?.logoUrl]);

  useEffect(() => {
    if (!tenantLoading && tenant && !tenant?.plan) {
      console.warn(
        '[Settings] Tenant sem dados de plano recebidos do backend.',
        tenant
      );
    }
  }, [tenant, tenantLoading]);

  const formatValue = useCallback(
    (value, fallbackLabel) => {
      if (value === undefined || value === null || value === '') {
        return fallbackLabel || t('settings.value_missing', 'Não informado');
      }
      return value;
    },
    [t]
  );

  const renderInfoCard = useCallback(
    (label, value, key) => (
      <div
        key={key}
        className="rounded-lg border border-brand-border bg-brand-surface/70 px-4 py-3"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-surfaceForeground/60">
          {label}
        </p>
        <p className="mt-1 text-sm text-brand-surfaceForeground">{value}</p>
      </div>
    ),
    []
  );

  const planName = useMemo(() => {
    const byOverview = billingOverview?.current_subscription?.plan_name;
    if (byOverview) return byOverview;
    return resolvePlanName(plan);
  }, [billingOverview?.current_subscription?.plan_name, plan]);
  const planTier = useMemo(() => resolvePlanTier(plan), [plan]);

  const moduleList = useMemo(() => {
    const resolved = new Set(resolvePlanModules(plan, modules).filter(Boolean));

    Object.entries(MODULE_CONFIG).forEach(([moduleKey, config]) => {
      const rawEnabled = Boolean(featureFlagsRaw?.modules?.[config.rawKey]);
      const flattenedEnabled = config.flagKey
        ? Boolean(flags?.[config.flagKey])
        : undefined;

      if (rawEnabled || flattenedEnabled) {
        resolved.add(moduleKey);
      }
    });

    return Array.from(resolved).filter((moduleKey) => {
      const config = MODULE_CONFIG[moduleKey];
      if (!config) return true;

      const featureKey = MODULE_REQUIREMENTS[moduleKey];
      if (featureKey) {
        const requiredPlan =
          TENANT_FEATURE_REQUIREMENTS[featureKey]?.requiredPlan;
        if (requiredPlan) {
          const cmp = comparePlanTiers(requiredPlan, planTier);
          if (cmp < 0) {
            return false;
          }
        }
      }

      if (
        config.rawKey &&
        featureFlagsRaw?.modules &&
        Object.prototype.hasOwnProperty.call(
          featureFlagsRaw.modules,
          config.rawKey
        )
      ) {
        return Boolean(featureFlagsRaw.modules[config.rawKey]);
      }

      if (
        config.flagKey &&
        flags &&
        Object.prototype.hasOwnProperty.call(flags, config.flagKey)
      ) {
        return Boolean(flags[config.flagKey]);
      }

      return true;
    });
  }, [plan, planTier, modules, flags, featureFlagsRaw]);

  useEffect(() => {
    const modulesFlags = featureFlagsRaw?.modules;
    let rawEnabled;
    if (
      modulesFlags &&
      Object.prototype.hasOwnProperty.call(modulesFlags, 'pwa_client_enabled')
    ) {
      rawEnabled = Boolean(modulesFlags.pwa_client_enabled);
    } else {
      rawEnabled = Boolean(flags?.enableCustomerPwa);
    }
    const listed =
      Array.isArray(moduleList) && moduleList.includes('pwa_client');
    setPwaClientEnabled(Boolean(rawEnabled || listed));
  }, [featureFlagsRaw?.modules, flags?.enableCustomerPwa, moduleList]);

  const channelCards = useMemo(
    () =>
      CHANNEL_CONFIG.map(({ key, defaultLabel }) => {
        const override =
          typeof notifRawOverrides?.[key] === 'boolean'
            ? Boolean(notifRawOverrides[key])
            : undefined;
        const rawEnabled =
          override !== undefined
            ? override
            : key === 'sms'
              ? Boolean(flags?.enableSms)
              : key === 'whatsapp'
                ? Boolean(flags?.enableWhatsapp)
                : key === 'push_mobile'
                  ? Boolean(flags?.enableMobilePush)
                  : key === 'push_web'
                    ? Boolean(flags?.enableWebPush)
                    : Boolean(channels?.[key]);
        return {
          key,
          label: t(`settings.channels.${key}`, defaultLabel),
          enabled: Boolean(channels?.[key]),
          rawEnabled,
        };
      }),
    [channels, flags, notifRawOverrides, t]
  );

  const canPurchaseCredits = useMemo(
    () => Boolean(billingOverview?.can_purchase_credits),
    [billingOverview]
  );
  const creditBalanceValue = useMemo(
    () => billingOverview?.credit_balance ?? balance?.current_balance ?? null,
    [billingOverview, balance]
  );
  const smsAvailable = Boolean(flags?.enableSms);
  const whatsappAvailable = Boolean(flags?.enableWhatsapp);
  // FEW-PLANS-01 (#320): SMS bloqueado durante o trial; liberado após os 14 dias.
  // A proteção real é no backend; aqui apenas refletimos no UI.
  const isTrialing = useMemo(
    () => billingOverview?.current_subscription?.status === 'trialing',
    [billingOverview]
  );

  const hasCustomerPwa = useMemo(() => {
    if (Array.isArray(moduleList) && moduleList.includes('pwa_client')) {
      return true;
    }

    if (flags?.enableCustomerPwa) {
      return true;
    }

    const modulesFlags = featureFlagsRaw?.modules;
    if (
      modulesFlags &&
      typeof modulesFlags === 'object' &&
      Object.prototype.hasOwnProperty.call(modulesFlags, 'pwa_client_enabled')
    ) {
      return Boolean(modulesFlags.pwa_client_enabled);
    }

    return false;
  }, [moduleList, flags, featureFlagsRaw]);

  const canToggleAutoInvite = hasCustomerPwa;

  const [creditsModalOpen, setCreditsModalOpen] = useState(false);

  const [notifSaving, setNotifSaving] = useState(false);
  const [autoRenewalSaving, setAutoRenewalSaving] = useState(false);

  const handleAutoRenewalToggle = async () => {
    if (!billingOverview || autoRenewalSaving) return;

    const currentStatus = billingOverview.has_auto_renewal;
    const action = currentStatus ? 'cancel' : 'reactivate';
    setAutoRenewalSaving(true);

    try {
      await billingOverviewApi.updateSubscriptionAction({
        action,
        slug: tenantSlug,
      });
      toast.success(
        t(
          currentStatus
            ? 'settings.auto_renewal.cancelled'
            : 'settings.auto_renewal.reactivated',
          currentStatus
            ? 'Renovação automática cancelada com sucesso.'
            : 'Renovação automática reativada com sucesso.'
        )
      );
      await refreshOverview();
    } catch (error) {
      console.error('Failed to toggle auto renewal:', error);
      toast.error(
        t(
          'settings.auto_renewal.error',
          'Erro ao atualizar renovação automática.'
        )
      );
    } finally {
      setAutoRenewalSaving(false);
    }
  };

  const { checkCredits } = useCreditGate();
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockAction, setBlockAction] = useState(null);

  const openCreditsModal = useCallback(() => {
    setCreditsModalOpen(true);
  }, []);

  const handleTabClick = useCallback(
    (tabId) => {
      if (tabId === 'account') {
        navigate('/settings/account');
        return;
      }
      setActiveTab(tabId);
    },
    [navigate]
  );

  const handleToggleChannel = useCallback(
    async (channelKey, nextValue) => {
      if (!tenant) return;

      // Credit check for enabling expensive channels
      if (
        nextValue === true &&
        (channelKey === 'sms' || channelKey === 'whatsapp')
      ) {
        const action = channelKey === 'sms' ? 'sms' : 'whatsapp';
        // Check if we have enough credits to even start using it (e.g. > 0 or specific cost)
        // For enabling, we might just check if they have ANY credits or positive balance?
        // Or strictly check against the cost of 1 message as a baseline requirement?
        // Using checkCredits(action) checks against the cost of 1 unit.
        if (!checkCredits(action)) {
          setBlockAction(
            channelKey === 'sms'
              ? t('settings.channels.sms', 'SMS')
              : t('settings.channels.whatsapp', 'WhatsApp')
          );
          setBlockModalOpen(true);
          // Revert the UI state if it was optimistically toggled?
          // The UI uses notifRawOverrides which we set below.
          // Since we return early here, we don't set it, so the UI should remain as is (disabled).
          return;
        }
      }

      setNotifSaving(true);
      try {
        const payload = {};
        if (channelKey === 'sms') payload.sms_enabled = nextValue;
        if (channelKey === 'whatsapp') payload.whatsapp_enabled = nextValue;
        if (channelKey === 'push_mobile')
          payload.push_mobile_enabled = nextValue;
        if (channelKey === 'push_web') payload.push_web_enabled = nextValue;

        const resp = await updateTenantNotifications(payload, {
          slug: tenant?.slug,
        });
        const nextRaw =
          channelKey === 'sms'
            ? Boolean(resp?.sms_enabled ?? nextValue)
            : channelKey === 'whatsapp'
              ? Boolean(resp?.whatsapp_enabled ?? nextValue)
              : channelKey === 'push_mobile'
                ? Boolean(resp?.push_mobile_enabled ?? nextValue)
                : channelKey === 'push_web'
                  ? Boolean(resp?.push_web_enabled ?? nextValue)
                  : Boolean(nextValue);
        setNotifRawOverrides((prev) => ({ ...prev, [channelKey]: nextRaw }));
        await refetch({ silent: true });
      } catch {
        // noop
      } finally {
        setNotifSaving(false);
      }
    },
    [tenant, refetch, checkCredits, t]
  );

  const sanitizedProfile = useMemo(() => {
    const defaults = DEFAULT_TENANT_META.profile || {};
    const sanitize = (value, defaultValue) => {
      if (value === undefined || value === null) {
        return '';
      }
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return '';
        if (defaultValue && trimmed === defaultValue) {
          return '';
        }
        return trimmed;
      }
      return value;
    };

    return {
      businessName: sanitize(profile?.businessName, defaults.businessName),
      email: sanitize(profile?.email, defaults.email),
      phone: sanitize(profile?.phone, defaults.phone),
      address: sanitize(profile?.address, defaults.address),
      timezone: sanitize(profile?.timezone, defaults.timezone),
      language: sanitize(profile?.language, defaults.language),
    };
  }, [profile]);

  const lastTenantRefreshRef = useRef(0);
  const refreshInFlightRef = useRef(false);
  const refreshTenantData = useCallback(async () => {
    const now = Date.now();
    if (refreshInFlightRef.current) return false;
    if (now - lastTenantRefreshRef.current < 60_000) return false;
    refreshInFlightRef.current = true;
    try {
      await refetch({ silent: true });
      lastTenantRefreshRef.current = Date.now();
      return true;
    } catch (err) {
      console.warn('[Settings] tenant refetch falhou:', err);
      return false;
    } finally {
      refreshInFlightRef.current = false;
    }
  }, [refetch]);

  useEffect(() => {
    const code = billingOverview?.current_subscription?.plan_code;
    if (code) {
      refreshTenantData();
    }
  }, [billingOverview?.current_subscription?.plan_code, refreshTenantData]);

  useEffect(() => {
    const handleFocus = () => {
      refreshOverview();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshOverview();
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [refreshOverview]);

  const handleBrandingSave = useCallback(async () => {
    setBrandingSaving(true);
    setBrandingError(null);
    setBrandingSuccess('');

    try {
      const cp = String(settings.brandingAddress.zip || '').trim();
      if (cp && !/^\d{4}-\d{3}$/.test(cp)) {
        setBrandingSaving(false);
        setBrandingError({ message: 'CP inválido. Use 9999-999.' });
        return;
      }
      await updateTenantBranding({
        logoFile: brandingFile,
        logoUrl: brandingFile ? undefined : settings.branding.logoUrl,
        addressStreet: settings.brandingAddress.street,
        addressNumber: settings.brandingAddress.number,
        addressComplement: settings.brandingAddress.complement,
        addressNeighborhood: settings.brandingAddress.neighborhood,
        addressCity: settings.brandingAddress.city,
        addressState: settings.brandingAddress.state,
        addressZip: settings.brandingAddress.zip,
        addressCountry: settings.brandingAddress.country,
      });

      await refreshTenantData();

      setBrandingSuccess(
        t('settings.branding.saved', 'Branding atualizado com sucesso.')
      );
      setBrandingFile(null);
    } catch (err) {
      const parsed = parseApiError(
        err,
        t('common.save_error', 'Falha ao salvar. Tente novamente.')
      );
      setBrandingError(parsed);
    } finally {
      setBrandingSaving(false);
    }
  }, [
    brandingFile,
    refreshTenantData,
    settings.branding.logoUrl,
    settings.brandingAddress,
    t,
  ]);

  const handleLogoFileChange = (event) => {
    const file = event.target.files?.[0];
    setBrandingFile(file || null);
    if (file) {
      setSettings((prev) => ({
        ...prev,
        branding: { ...prev.branding, logoUrl: '' },
      }));
    }
  };

  const handleAutoInviteToggle = useCallback(async () => {
    if (autoInviteSaving || tenantLoading || !canToggleAutoInvite) {
      return;
    }

    const nextValue = !autoInviteEnabled;
    setAutoInviteEnabled(nextValue);
    setAutoInviteSaving(true);

    try {
      await updateTenantAutoInvite(nextValue);
      await refreshTenantData();
    } catch {
      setAutoInviteEnabled(!nextValue);
    } finally {
      setAutoInviteSaving(false);
    }
  }, [
    autoInviteEnabled,
    autoInviteSaving,
    canToggleAutoInvite,
    refreshTenantData,
    tenantLoading,
  ]);

  const handlePwaClientToggle = useCallback(async () => {
    if (pwaClientSaving || tenantLoading) return;
    const nextValue = !pwaClientEnabled;
    setPwaClientEnabled(nextValue);
    setPwaClientSaving(true);
    setPwaClientError(null);
    setPwaClientSuccess('');
    try {
      const resp = await updateTenantModules({ pwaClientEnabled: nextValue });
      await refreshTenantData();
      const ok = Boolean(resp?.pwa_client_enabled);
      setPwaClientSuccess(
        ok
          ? t('settings.pwa_client.success_enabled', 'PWA Cliente habilitado.')
          : t(
              'settings.pwa_client.success_disabled',
              'PWA Cliente desabilitado.'
            )
      );
    } catch (err) {
      const parsed = parseApiError(
        err,
        t(
          'settings.pwa_client.error',
          'Não foi possível atualizar o PWA Cliente.'
        )
      );
      setPwaClientError(parsed);
      setPwaClientEnabled(!nextValue);
    } finally {
      setPwaClientSaving(false);
    }
  }, [pwaClientEnabled, pwaClientSaving, refreshTenantData, tenantLoading, t]);

  const handleGeneralSave = async () => {
    if (generalSaving) return;
    setGeneralSaving(true);
    setGeneralError(null);
    setGeneralSuccess('');

    try {
      await updateTenantContact({
        email: settings.general.email,
        phone: settings.general.phone,
        phone_number: settings.general.phone,
        businessName: settings.general.businessName,
        address: settings.general.address,
      });

      setGeneralSuccess(t('common.saving_done', 'Salvo com sucesso.'));

      // Atualiza o contexto do tenant se necessário
      // applyTenantBootstrap não é exportado ou acessível aqui diretamente,
      // mas podemos chamar refreshTenantData para recarregar tudo.
      await refreshTenantData();
    } catch (err) {
      const parsed = parseApiError(
        err,
        t('common.save_failed', 'Falha ao salvar.')
      );
      setGeneralError(parsed);
    } finally {
      setGeneralSaving(false);
    }
  };

  const loadBusinessHours = useCallback(async () => {
    setBusinessHoursLoading(true);
    setBusinessHoursError(null);
    try {
      const data = await fetchTenantBusinessHours();
      const normalizedHours = normalizeWorkingHoursFromApi(data);
      setSettings((prev) => ({
        ...prev,
        business: {
          ...(prev.business || {}),
          workingHours: normalizedHours,
        },
      }));
      setBusinessHoursLoadedSlug(tenant?.slug || null);
    } catch (err) {
      const parsed = parseApiError(
        err,
        t(
          'settings.general.working_hours_load_error',
          'Não foi possível carregar os horários de funcionamento.'
        )
      );
      setBusinessHoursError(parsed);
    } finally {
      setBusinessHoursLoading(false);
    }
  }, [t, tenant?.slug]);

  useEffect(() => {
    if (!tenant?.slug) return;
    loadBusinessHours();
  }, [tenant?.slug, loadBusinessHours]);

  const handleBusinessHoursSave = useCallback(async () => {
    if (businessHoursSaving) return;

    const currentHours = settings.business?.workingHours || {};
    const validation = validateWorkingHours(currentHours, t);
    if (!validation.isValid) {
      setBusinessHoursFieldErrors(validation.errors);
      setBusinessHoursError({
        message: t(
          'settings.general.working_hours_fix_errors',
          'Corrija os erros dos dias ativos antes de salvar.'
        ),
      });
      setBusinessHoursSuccess('');
      return;
    }

    setBusinessHoursSaving(true);
    setBusinessHoursError(null);
    setBusinessHoursSuccess('');
    setBusinessHoursFieldErrors({});

    try {
      const payload = buildBusinessHoursPayload(currentHours);
      const response = await updateTenantBusinessHours(payload);
      const normalizedHours = normalizeWorkingHoursFromApi(response);

      setSettings((prev) => ({
        ...prev,
        business: {
          ...(prev.business || {}),
          workingHours: normalizedHours,
        },
      }));

      setBusinessHoursSuccess(
        t(
          'settings.general.working_hours_save_success',
          'Horário de funcionamento salvo com sucesso.'
        )
      );
      await refreshTenantData();
    } catch (err) {
      const parsed = parseApiError(
        err,
        t(
          'settings.general.working_hours_save_error',
          'Não foi possível salvar os horários de funcionamento.'
        )
      );
      setBusinessHoursError(parsed);
    } finally {
      setBusinessHoursSaving(false);
    }
  }, [
    businessHoursSaving,
    settings.business?.workingHours,
    t,
    refreshTenantData,
  ]);

  const renderPlanSummary = () => (
    <Card className="p-6 bg-brand-surface text-brand-surfaceForeground">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-brand-surfaceForeground">
            {t('settings.plan_title', 'Plano atual')}
          </h3>
          <p className="text-sm text-brand-surfaceForeground/80">
            {planName || t('settings.plan_unknown', 'Plano não identificado')}
          </p>
          {billingOverview &&
          typeof billingOverview.has_auto_renewal === 'boolean' ? (
            <p className="mt-1 text-xs text-brand-surfaceForeground/70">
              {t('settings.auto_renewal_status', 'Renovação automática')}:{' '}
              <span
                className={
                  billingOverview.has_auto_renewal
                    ? 'font-medium text-green-600'
                    : 'font-medium text-red-600'
                }
              >
                {billingOverview.has_auto_renewal
                  ? t('common.active', 'Ativa')
                  : t('common.cancelled', 'Cancelada')}
              </span>
            </p>
          ) : null}
          {tenantLoading ? (
            <p className="mt-1 text-xs text-brand-surfaceForeground/60">
              {t('common.loading_data', 'Carregando dados do plano...')}
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-6 space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-brand-surfaceForeground">
            {t('settings.plan_modules', 'Módulos incluídos')}
          </h4>
          {moduleList.length ? (
            <ul className="mt-2 space-y-1 text-sm text-brand-surfaceForeground/80">
              {moduleList.map((module) => {
                const label = resolveModuleLabel(module, t);
                return <li key={module}>• {label}</li>;
              })}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-brand-surfaceForeground/60">
              {t(
                'settings.plan_modules_empty',
                'Nenhum módulo adicional definido para este plano.'
              )}
            </p>
          )}
        </div>
      </div>
    </Card>
  );

  const renderBrandingSettings = () => (
    <div className="space-y-6">
      {/* Campos de cor removidos (FEW-BRAND-01) */}

      <div className="space-y-3">
        <label className="block text-sm font-medium text-brand-surfaceForeground">
          {t('settings.branding.logo_helper', 'Logo')}
        </label>
        {brandingPreview ? (
          <img
            src={brandingPreview}
            alt={t('settings.branding.preview_alt', 'Pré-visualização do logo')}
            className="h-14 w-14 rounded border border-brand-border object-contain"
          />
        ) : (
          <p className="text-sm text-brand-surfaceForeground/60">
            {t('settings.branding.no_logo', 'Nenhum logo definido.')}
          </p>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="cursor-pointer text-sm text-brand-primary hover:text-brand-primary/80 underline">
            {t('settings.branding.logo_file', 'Arquivo de logo')}
            <input
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              onChange={handleLogoFileChange}
              disabled={tenantLoading}
              className="hidden"
            />
          </label>
          <span className="text-xs text-brand-surfaceForeground/60">
            {t('settings.branding.logo_info', 'PNG, JPG ou SVG até 2MB.')}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-brand-surfaceForeground">
          {t('settings.branding_address.title', 'Morada do estabelecimento')}
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-brand-surfaceForeground/70">
              {t('settings.branding_address.street', 'Rua')}
            </label>
            <input
              type="text"
              value={settings.brandingAddress.street}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  brandingAddress: {
                    ...prev.brandingAddress,
                    street: e.target.value,
                  },
                }))
              }
              className="rounded border border-brand-border bg-brand-surface px-2 py-1 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-brand-surfaceForeground/70">
              {t('settings.branding_address.number', 'Número')}
            </label>
            <input
              type="text"
              value={settings.brandingAddress.number}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  brandingAddress: {
                    ...prev.brandingAddress,
                    number: e.target.value,
                  },
                }))
              }
              className="rounded border border-brand-border bg-brand-surface px-2 py-1 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label className="text-xs text-brand-surfaceForeground/70">
              {t('settings.branding_address.complement', 'Complemento')}
            </label>
            <input
              type="text"
              value={settings.brandingAddress.complement}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  brandingAddress: {
                    ...prev.brandingAddress,
                    complement: e.target.value,
                  },
                }))
              }
              className="rounded border border-brand-border bg-brand-surface px-2 py-1 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-brand-surfaceForeground/70">
              {t('settings.branding_address.neighborhood', 'Freguesia')}
            </label>
            <input
              type="text"
              value={settings.brandingAddress.neighborhood}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  brandingAddress: {
                    ...prev.brandingAddress,
                    neighborhood: e.target.value,
                  },
                }))
              }
              className="rounded border border-brand-border bg-brand-surface px-2 py-1 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-brand-surfaceForeground/70">
              {t('settings.branding_address.zip', 'CP (Código Postal)')}
            </label>
            <input
              type="text"
              value={settings.brandingAddress.zip}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  brandingAddress: {
                    ...prev.brandingAddress,
                    zip: formatPostalCodePT(e.target.value),
                  },
                }))
              }
              className="rounded border border-brand-border bg-brand-surface px-2 py-1 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-brand-surfaceForeground/70">
              {t('settings.branding_address.state', 'Distrito')}
            </label>
            <input
              type="text"
              value={settings.brandingAddress.state}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  brandingAddress: {
                    ...prev.brandingAddress,
                    state: e.target.value,
                  },
                }))
              }
              className="rounded border border-brand-border bg-brand-surface px-2 py-1 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-brand-surfaceForeground/70">
              {t('settings.branding_address.city', 'Localidade')}
            </label>
            <input
              type="text"
              value={settings.brandingAddress.city}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  brandingAddress: {
                    ...prev.brandingAddress,
                    city: e.target.value,
                  },
                }))
              }
              className="rounded border border-brand-border bg-brand-surface px-2 py-1 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-brand-surfaceForeground/70">
              {t('settings.branding_address.country', 'País')}
            </label>
            <input
              type="text"
              value={settings.brandingAddress.country}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  brandingAddress: {
                    ...prev.brandingAddress,
                    country: e.target.value,
                  },
                }))
              }
              className="rounded border border-brand-border bg-brand-surface px-2 py-1 text-sm"
            />
          </div>
        </div>
      </div>

      {brandingError ? (
        <p className="text-sm text-red-600">{brandingError.message}</p>
      ) : null}
      {brandingSuccess ? (
        <p className="text-sm text-emerald-600">{brandingSuccess}</p>
      ) : null}

      <button
        onClick={handleBrandingSave}
        className="w-full text-center text-brand-primary hover:text-brand-primary/80 underline text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={tenantLoading || brandingSaving}
      >
        {brandingSaving
          ? t('common.saving', 'Salvando...')
          : t('settings.save')}
      </button>
    </div>
  );

  const renderGeneralSettings = () => {
    const toggleWorkingDay = (dayKey) => {
      setSettings((prev) => {
        const fallbackDay = DEFAULT_TENANT_META.profile.workingHours?.[
          dayKey
        ] || {
          open: '09:00',
          close: '18:00',
          closed: false,
        };
        const currentDay = prev.business?.workingHours?.[dayKey] || fallbackDay;
        const nextClosed = !currentDay.closed;

        return {
          ...prev,
          business: {
            ...(prev.business || {}),
            workingHours: {
              ...(prev.business?.workingHours || {}),
              [dayKey]: {
                ...fallbackDay,
                ...currentDay,
                closed: nextClosed,
              },
            },
          },
        };
      });
      setBusinessHoursSuccess('');
      setBusinessHoursError(null);
      setBusinessHoursFieldErrors((prev) => {
        if (!prev?.[dayKey]) return prev;
        const next = { ...prev };
        delete next[dayKey];
        return next;
      });
    };

    const updateWorkingDayTime = (dayKey, field, value) => {
      setSettings((prev) => {
        const fallbackDay = DEFAULT_TENANT_META.profile.workingHours?.[
          dayKey
        ] || {
          open: '09:00',
          close: '18:00',
          closed: false,
        };
        const currentDay = prev.business?.workingHours?.[dayKey] || fallbackDay;

        return {
          ...prev,
          business: {
            ...(prev.business || {}),
            workingHours: {
              ...(prev.business?.workingHours || {}),
              [dayKey]: {
                ...fallbackDay,
                ...currentDay,
                [field]: value,
              },
            },
          },
        };
      });
      setBusinessHoursSuccess('');
      setBusinessHoursError(null);
      setBusinessHoursFieldErrors((prev) => {
        if (!prev?.[dayKey]) return prev;
        const next = { ...prev };
        delete next[dayKey];
        return next;
      });
    };

    const cardItems = [];

    cardItems.push({
      key: 'tenantName',
      label: t('settings.general.tenant_name', 'Nome do salão'),
      value: tenant?.name,
    });

    cardItems.push({
      key: 'tenantSlug',
      label: t('settings.general.slug', 'Slug'),
      value: tenant?.slug,
    });

    if (
      sanitizedProfile.businessName &&
      sanitizedProfile.businessName.toLowerCase() !==
        (tenant?.name || '').toLowerCase()
    ) {
      cardItems.push({
        key: 'businessName',
        label: t('settings.general.business_name', 'Nome comercial'),
        value: sanitizedProfile.businessName,
      });
    }

    if (sanitizedProfile.email) {
      cardItems.push({
        key: 'email',
        label: t('settings.general.email', 'Email de contato'),
        value: sanitizedProfile.email,
      });
    }

    if (sanitizedProfile.phone) {
      cardItems.push({
        key: 'phone',
        label: t('settings.general.phone', 'Telefone'),
        value: sanitizedProfile.phone,
      });
    }

    const timezoneValue = tenant?.timezone || sanitizedProfile.timezone;
    if (timezoneValue) {
      cardItems.push({
        key: 'timezone',
        label: t('settings.general.timezone', 'Fuso horário'),
        value: timezoneValue,
      });
    }

    if (sanitizedProfile.language) {
      cardItems.push({
        key: 'language',
        label: t('settings.general.language', 'Idioma'),
        value: sanitizedProfile.language.toUpperCase(),
      });
    }

    if (tenant?.currency) {
      cardItems.push({
        key: 'currency',
        label: t('settings.general.currency', 'Moeda padrão'),
        value: tenant.currency.toUpperCase(),
      });
    }

    return (
      <div className="space-y-6">
        <Card className="p-6 bg-brand-surface text-brand-surfaceForeground">
          <h3 className="mb-4 text-lg font-semibold text-brand-surfaceForeground">
            {t('settings.general.info_title', 'Informações Gerais')}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {cardItems.map((item) =>
              renderInfoCard(item.label, formatValue(item.value), item.key)
            )}
          </div>
        </Card>

        <PlanGate
          featureKey="enableCustomerPwa"
          fallback={
            <Card className="p-6 bg-brand-surface text-brand-surfaceForeground">
              <UpgradePrompt featureKey="enableCustomerPwa" variant="inline" />
            </Card>
          }
        >
          <Card className="p-6 bg-brand-surface text-brand-surfaceForeground">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-brand-surfaceForeground">
                    {t('settings.pwa_client.title', 'PWA Cliente')}
                  </h3>
                  {pwaClientLocked && (
                    <LockIcon
                      className="h-4 w-4 text-brand-surfaceForeground/40"
                      title={t('upgrade.available_in_plan', {
                        plan: pwaClientTier,
                        defaultValue: `Disponível no plano ${pwaClientTier}`,
                      })}
                    />
                  )}
                </div>
                <p className="text-sm text-brand-surfaceForeground/80">
                  {t(
                    'settings.pwa_client.description',
                    'Ative o PWA para permitir que seus clientes agendem pelo app.'
                  )}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`text-sm font-medium ${
                      autoInviteEnabled
                        ? 'text-emerald-600'
                        : 'text-brand-surfaceForeground/60'
                    }`}
                  >
                    {t(
                      'settings.pwa_client.auto_invite_label',
                      'Convites automáticos:'
                    )}{' '}
                    {autoInviteEnabled
                      ? t('settings.pwa_client.status_enabled', 'Ativo')
                      : t('settings.pwa_client.status_disabled', 'Inativo')}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={autoInviteEnabled}
                    aria-label={t(
                      'settings.pwa_client.auto_invite_toggle_label',
                      'Alternar convites automáticos'
                    )}
                    onClick={handleAutoInviteToggle}
                    disabled={autoInviteSaving || pwaClientLocked}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      autoInviteEnabled ? 'bg-brand-primary' : 'bg-gray-300'
                    } ${autoInviteSaving || pwaClientLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                    title={
                      pwaClientLocked
                        ? t('upgrade.available_in_plan', {
                            plan: pwaClientTier,
                            defaultValue: `Disponível no plano ${pwaClientTier}`,
                          })
                        : ''
                    }
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        autoInviteEnabled ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  title={
                    pwaClientEnabled
                      ? t('settings.pwa_client.status_enabled', 'Ativo')
                      : t('settings.pwa_client.status_disabled', 'Inativo')
                  }
                  className={`text-sm font-medium ${
                    pwaClientEnabled
                      ? 'text-emerald-600'
                      : 'text-brand-surfaceForeground/60'
                  }`}
                >
                  {pwaClientEnabled
                    ? t('settings.pwa_client.status_enabled', 'Ativo')
                    : t('settings.pwa_client.status_disabled', 'Inativo')}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={pwaClientEnabled}
                  aria-label={t(
                    'settings.pwa_client.accessible_label',
                    'Alternar PWA Cliente'
                  )}
                  onClick={handlePwaClientToggle}
                  disabled={pwaClientSaving || tenantLoading || pwaClientLocked}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    pwaClientEnabled ? 'bg-brand-primary' : 'bg-gray-300'
                  } ${pwaClientSaving || tenantLoading || pwaClientLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                  title={
                    pwaClientLocked
                      ? t('upgrade.available_in_plan', {
                          plan: pwaClientTier,
                          defaultValue: `Disponível no plano ${pwaClientTier}`,
                        })
                      : ''
                  }
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      pwaClientEnabled ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
            {pwaClientError && (
              <p className="mt-2 text-sm text-red-600">
                {pwaClientError.message}
              </p>
            )}
            {pwaClientSuccess && (
              <p className="mt-2 text-sm text-emerald-600">
                {pwaClientSuccess}
              </p>
            )}
          </Card>
        </PlanGate>

        <Card className="p-6 bg-brand-surface text-brand-surfaceForeground">
          <h3 className="mb-4 text-lg font-semibold text-brand-surfaceForeground">
            {t('settings.general.edit_title', 'Editar Informações')}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormInput
              label={t('settings.general.edit_business_name', 'Nome Comercial')}
              value={settings.general.businessName}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  general: {
                    ...settings.general,
                    businessName: e.target.value,
                  },
                })
              }
            />
            <FormInput
              label={t('settings.general.edit_email', 'Email de Contato')}
              type="email"
              value={settings.general.email}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  general: { ...settings.general, email: e.target.value },
                })
              }
            />
            <FormInput
              label={t('settings.general.edit_phone', 'Telefone')}
              type="tel"
              value={settings.general.phone}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  general: { ...settings.general, phone: e.target.value },
                })
              }
            />
          </div>
          {generalError && (
            <p className="mt-4 text-sm text-red-600">{generalError.message}</p>
          )}
          {generalSuccess && (
            <p className="mt-4 text-sm text-emerald-600">{generalSuccess}</p>
          )}
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={handleGeneralSave}
              disabled={generalSaving}
              className="rounded-lg px-4 py-2 text-brand-primary hover:text-brand-primary/90 disabled:opacity-50 bg-transparent border-0 underline"
            >
              {generalSaving
                ? t('common.saving', 'Salvando...')
                : t('common.save_changes', 'Salvar Alterações')}
            </button>
          </div>
        </Card>

        <Card className="p-6 bg-brand-surface text-brand-surfaceForeground">
          <h3 className="mb-2 text-lg font-semibold text-brand-surfaceForeground">
            {t(
              'settings.general.working_hours_title',
              'Horário de funcionamento'
            )}
          </h3>
          <p className="text-sm text-brand-surfaceForeground/80">
            {t(
              'settings.general.working_hours_description',
              'Configure os horários de abertura por dia da semana para geração automática de horários.'
            )}
          </p>
          <p className="mt-2 text-xs text-brand-surfaceForeground/60">
            {t(
              'settings.general.working_hours_placeholder',
              'A configuração detalhada por dia será adicionada nos próximos itens desta tarefa.'
            )}
          </p>

          <div
            className="mt-4 space-y-2"
            role="group"
            aria-label={t(
              'settings.general.working_hours_title',
              'Horário de funcionamento'
            )}
          >
            {WEEKDAY_KEYS.map((dayKey) => {
              const fallbackDay =
                DEFAULT_TENANT_META.profile.workingHours?.[dayKey] ||
                DEFAULT_TENANT_META.profile.workingHours?.monday;
              const daySettings =
                settings.business?.workingHours?.[dayKey] || fallbackDay;
              const isActive = !daySettings?.closed;
              const dayError = businessHoursFieldErrors?.[dayKey];

              return (
                <div
                  key={dayKey}
                  className="rounded-lg border border-brand-border bg-brand-surface/70 px-3 py-2"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm text-brand-surfaceForeground">
                      {t(`settings.days.${dayKey}`, dayKey)}
                    </span>

                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={daySettings?.open || ''}
                          onChange={(e) =>
                            updateWorkingDayTime(dayKey, 'open', e.target.value)
                          }
                          disabled={!isActive || businessHoursSaving}
                          aria-label={`${t(`settings.days.${dayKey}`, dayKey)} ${t('settings.general.working_hours_start', 'Início')}`}
                          className="w-24 rounded border border-brand-border bg-brand-surface px-2 py-1 text-sm text-brand-surfaceForeground disabled:cursor-not-allowed disabled:opacity-60"
                        />
                        <span className="text-xs text-brand-surfaceForeground/60">
                          {t('common.to', 'até')}
                        </span>
                        <input
                          type="time"
                          value={daySettings?.close || ''}
                          onChange={(e) =>
                            updateWorkingDayTime(
                              dayKey,
                              'close',
                              e.target.value
                            )
                          }
                          disabled={!isActive || businessHoursSaving}
                          aria-label={`${t(`settings.days.${dayKey}`, dayKey)} ${t('settings.general.working_hours_end', 'Fim')}`}
                          className="w-24 rounded border border-brand-border bg-brand-surface px-2 py-1 text-sm text-brand-surfaceForeground disabled:cursor-not-allowed disabled:opacity-60"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs font-medium ${
                            isActive
                              ? 'text-emerald-600'
                              : 'text-brand-surfaceForeground/60'
                          }`}
                        >
                          {isActive
                            ? t('common.active', 'Ativo')
                            : t('common.inactive', 'Inativo')}
                        </span>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={isActive}
                          aria-label={t(`settings.days.${dayKey}`, dayKey)}
                          onClick={() => toggleWorkingDay(dayKey)}
                          disabled={businessHoursSaving}
                          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40 ${
                            isActive ? 'bg-brand-primary' : 'bg-gray-300'
                          } ${businessHoursSaving ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                              isActive ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {dayError ? (
                    <p className="mt-2 text-xs text-red-600">{dayError}</p>
                  ) : null}
                </div>
              );
            })}
          </div>

          {businessHoursLoading ? (
            <p className="mt-3 text-xs text-brand-surfaceForeground/60">
              {t(
                'settings.general.working_hours_loading',
                'Carregando horários...'
              )}
            </p>
          ) : null}
          {businessHoursError ? (
            <p className="mt-3 text-sm text-red-600">
              {businessHoursError.message}
            </p>
          ) : null}
          {businessHoursSuccess ? (
            <p className="mt-3 text-sm text-emerald-600">
              {businessHoursSuccess}
            </p>
          ) : null}

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleBusinessHoursSave}
              disabled={businessHoursSaving || businessHoursLoading}
              className="rounded-lg px-4 py-2 text-brand-primary hover:text-brand-primary/90 disabled:opacity-50 bg-transparent border-0 underline"
            >
              {businessHoursSaving
                ? t('common.saving', 'Salvando...')
                : t(
                    'settings.general.working_hours_save_button',
                    'Salvar alterações'
                  )}
            </button>
          </div>
        </Card>

        <div className="pt-6 border-t border-brand-border">
          <button
            onClick={handleLogout}
            className="w-full text-center text-rose-600 hover:text-rose-700 underline text-sm py-2"
          >
            {t('nav.logout', 'Sair')}
          </button>
        </div>
      </div>
    );
  };

  const renderNotificationSettings = () => (
    <>
      <div className="space-y-4">
        {tenantLoading ? (
          <p className="text-sm text-brand-surfaceForeground/60">
            {t('common.loading_data', 'Carregando dados...')}
          </p>
        ) : null}

        {/* Renovação Automática */}
        <Card className="rounded-lg border border-brand-border bg-brand-surface/70 px-4 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <p className="text-sm font-semibold text-brand-surfaceForeground">
                {t('settings.auto_renewal.title', 'Renovação Automática')}
              </p>
              <p className="mt-1 text-sm text-brand-surfaceForeground/80">
                {t(
                  'settings.auto_renewal.description',
                  'Gerencie a renovação automática do seu plano de assinatura.'
                )}
              </p>
              {autoRenewalSaving ? (
                <p className="mt-2 text-xs text-brand-surfaceForeground/60">
                  {t('common.saving', 'Salvando...')}
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-sm font-medium ${
                  billingOverview?.has_auto_renewal
                    ? 'text-emerald-600'
                    : 'text-brand-surfaceForeground/60'
                }`}
              >
                {billingOverview?.has_auto_renewal
                  ? t('common.active', 'Ativa')
                  : t('common.inactive', 'Inativa')}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={billingOverview?.has_auto_renewal}
                onClick={handleAutoRenewalToggle}
                disabled={autoRenewalSaving || !billingOverview}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  billingOverview?.has_auto_renewal
                    ? 'bg-brand-primary'
                    : 'bg-gray-300'
                } ${
                  autoRenewalSaving || !billingOverview
                    ? 'cursor-not-allowed opacity-60'
                    : 'cursor-pointer'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    billingOverview?.has_auto_renewal
                      ? 'translate-x-5'
                      : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          {channelCards.map(({ key, label, enabled, rawEnabled }) => (
            <div
              key={key}
              title={
                enabled
                  ? t(
                      'settings.tooltip.channel_enabled',
                      'Canal ativo para o salão'
                    )
                  : t(
                      'settings.tooltip.channel_disabled',
                      'Canal indisponível: requer créditos ou plano compatível'
                    )
              }
              className="rounded-lg border border-brand-border bg-brand-surface/70 px-4 py-3"
            >
              <p
                title={String(label)}
                className="text-xs font-semibold uppercase tracking-wide text-brand-surfaceForeground/60"
              >
                {label}
              </p>
              <p
                title={
                  rawEnabled
                    ? t('settings.channel_enabled', 'Ativo')
                    : t('settings.channel_disabled', 'Inativo')
                }
                className="mt-1 text-sm text-brand-surfaceForeground"
              >
                {rawEnabled
                  ? t('settings.channel_enabled', 'Ativo')
                  : t('settings.channel_disabled', 'Inativo')}
              </p>
              {['sms', 'whatsapp', 'push_mobile', 'push_web'].includes(key) ? (
                <div className="mt-3 flex items-center justify-end gap-3">
                  {key === 'whatsapp' && (
                    <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">
                      {t('common.coming_soon', 'Em breve')}
                    </span>
                  )}
                  {key === 'sms' && isTrialing && (
                    <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">
                      {t(
                        'settings.notifications.sms_after_trial',
                        'Disponível após o período de teste'
                      )}
                    </span>
                  )}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={rawEnabled}
                    aria-label={String(label)}
                    onClick={() => handleToggleChannel(key, !rawEnabled)}
                    disabled={
                      notifSaving ||
                      key === 'whatsapp' ||
                      (key === 'sms' && isTrialing)
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      rawEnabled ? 'bg-brand-primary' : 'bg-gray-300'
                    } ${
                      notifSaving ||
                      key === 'whatsapp' ||
                      (key === 'sms' && isTrialing)
                        ? 'cursor-not-allowed opacity-60'
                        : 'cursor-pointer'
                    }`}
                    title={
                      key === 'whatsapp'
                        ? t(
                            'settings.notifications.whatsapp_coming_soon_tooltip',
                            'WhatsApp será ativado após aprovação Meta Business. Aguarde novidades!'
                          )
                        : key === 'sms' && isTrialing
                          ? t(
                              'settings.notifications.sms_after_trial_tooltip',
                              'O envio de SMS fica disponível após o período de teste de 14 dias.'
                            )
                          : ''
                    }
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        rawEnabled ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>

        {!smsAvailable || !whatsappAvailable ? (
          <div className="mt-4 flex flex-col gap-3 rounded-lg border border-brand-border bg-brand-light px-4 py-3 text-brand-surfaceForeground">
            <div className="flex items-center justify-between">
              <p className="text-sm">
                {t(
                  'settings.notifications_paywall_hint',
                  'Canais avançados disponíveis com créditos.'
                )}
              </p>
              <FeatureGate
                featureKey="enableSms"
                fallback={
                  canPurchaseCredits ? (
                    <button
                      type="button"
                      title={t(
                        'settings.tooltip.add_credits',
                        'Comprar créditos para liberar canais avançados'
                      )}
                      className="rounded-md border border-brand-border px-3 py-1 text-xs font-medium"
                      onClick={openCreditsModal}
                    >
                      {t('settings.add_credits', 'Adicionar créditos')}
                    </button>
                  ) : null
                }
              >
                {creditBalanceValue ? (
                  <span className="text-xs">
                    {t('settings.credits_available', 'Créditos disponíveis')}{' '}
                    {String(creditBalanceValue)}
                  </span>
                ) : null}
              </FeatureGate>
            </div>

            {!whatsappAvailable && (
              <div className="rounded border border-amber-500/20 bg-amber-500/5 p-2">
                <p className="text-xs text-amber-700">
                  {t(
                    'settings.notifications.whatsapp_waiting_meta',
                    'WhatsApp estará disponível em breve. Estamos aguardando aprovação da Meta Business.'
                  )}
                </p>
              </div>
            )}
          </div>
        ) : null}

        {/* Credit Alerts Configuration - Moved to Credits tab */}
      </div>
      <CreditPurchaseModal
        open={creditsModalOpen}
        onClose={() => setCreditsModalOpen(false)}
      />
    </>
  );

  const renderBusinessSettings = () => (
    <div className="space-y-4">
      <h3 className="text-base font-medium text-brand-surfaceForeground">
        {t('settings.tabs.business', 'Negócio')}
      </h3>
      <p className="text-sm text-brand-surfaceForeground/80">
        {t(
          'settings.business.placeholder',
          'Gestão de operação (horários, duração de atendimentos, buffers) será conectada ao backend nas tarefas FEW-241a/242.'
        )}
      </p>
      <p className="text-xs text-brand-surfaceForeground/60">
        {t(
          'settings.business_readonly_hint',
          'Enquanto isso, utilize o console Ops para ajustes ou contacte o suporte.'
        )}
      </p>
    </div>
  );

  return (
    <FullPageLayout>
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')}>
        {planName ? (
          <span
            title={t('settings.plan_badge', 'Plano') + ': ' + String(planName)}
            className="rounded-full border border-brand-border bg-brand-light px-3 py-1 text-xs font-medium text-brand-surfaceForeground"
          >
            {t('settings.plan_badge', 'Plano')}: {planName}
          </span>
        ) : null}
        {/* botão "Gerir plano" removido — usar página de Planos */}
        <span
          role="button"
          onClick={() => {
            if (!creditLoading) {
              refreshCredits();
            }
          }}
          title={
            creditLoading
              ? t('credits.loading', 'Carregando créditos...')
              : t('credits.refresh_hint', 'Clique para atualizar o saldo')
          }
          className="cursor-pointer rounded-full border border-brand-border bg-brand-light px-3 py-1 text-xs font-medium text-brand-surfaceForeground"
        >
          {t('credits.label', 'Créditos')}:{' '}
          {creditLoading
            ? t('common.loading', 'Carregando')
            : creditError
              ? t('credits.unavailable', 'Indisponível')
              : (balance?.current_balance ?? '—')}
        </span>
      </PageHeader>

      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        {tenantError ? (
          <Card className="border border-red-200 bg-red-50 p-4 text-red-800">
            <p className="text-sm font-medium">
              {tenantError.message ||
                t(
                  'settings.error_loading_tenant',
                  'Não foi possível carregar todas as informações do salão.'
                )}
            </p>
            <p className="mt-1 text-xs">
              {t(
                'settings.error_loading_hint',
                'Tente atualizar a página ou verificar sua conexão. Alguns dados podem estar desatualizados.'
              )}
            </p>
          </Card>
        ) : null}

        {renderPlanSummary()}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Card className="p-4">
              <nav className="space-y-2">
                {TAB_ITEMS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'border border-brand-border bg-brand-light text-brand-surfaceForeground'
                        : 'text-brand-surfaceForeground/70 hover:bg-brand-light hover:text-brand-surfaceForeground'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {t(tab.label)}
                  </button>
                ))}
              </nav>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card className="p-4 sm:p-6 bg-brand-surface text-brand-surfaceForeground">
              {activeTab === 'branding' && renderBrandingSettings()}
              {activeTab === 'general' && renderGeneralSettings()}
              {activeTab === 'notifications' && renderNotificationSettings()}
              {activeTab === 'business' && renderBusinessSettings()}
              {activeTab === 'credits' && (
                <RoleProtectedRoute allowedRoles={['owner']}>
                  <CreditSettings />
                </RoleProtectedRoute>
              )}
              {activeTab === 'data' && (
                <RoleProtectedRoute allowedRoles={['owner']}>
                  <BulkImportExportPanel />
                </RoleProtectedRoute>
              )}
            </Card>
          </div>
        </div>
      </div>
      <CreditPurchaseModal
        open={creditsModalOpen}
        onClose={() => setCreditsModalOpen(false)}
      />
      <CreditBlockModal
        open={blockModalOpen}
        onClose={() => setBlockModalOpen(false)}
        onBuy={() => {
          setBlockModalOpen(false);
          setCreditsModalOpen(true);
        }}
        action={blockAction}
      />
    </FullPageLayout>
  );
}

export default Settings;
