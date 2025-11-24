import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import FullPageLayout from '../layouts/FullPageLayout';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import FormButton from '../components/ui/FormButton';
import { useTenant } from '../hooks/useTenant';
import useCreditBalance from '../hooks/useCreditBalance';
import useBillingOverview from '../hooks/useBillingOverview';
import FeatureGate from '../components/security/FeatureGate';
import PlanGate from '../components/security/PlanGate';
import { DEFAULT_TENANT_META, resolveTenantAssetUrl } from '../utils/tenant';
import { parseApiError } from '../utils/apiError';
import {
  fetchTenantMeta,
  updateTenantBranding,
  updateTenantAutoInvite,
} from '../api/tenant';
import { fetchTenantBootstrap } from '../api/auth';
import {
  TENANT_FEATURE_REQUIREMENTS,
  describeFeatureRequirement,
} from '../constants/tenantFeatures';
import {
  resolvePlanModules,
  resolvePlanName,
  resolvePlanTier,
  comparePlanTiers,
} from '../utils/tenantPlan';

const TAB_ITEMS = [
  { id: 'branding', label: 'settings.tabs.branding', icon: '🖼️' },
  { id: 'general', label: 'settings.tabs.general', icon: '⚙️' },
  { id: 'notifications', label: 'settings.tabs.notifications', icon: '🔔' },
  { id: 'business', label: 'settings.tabs.business', icon: '🏢' },
];

const FEATURE_LIST = Object.entries(TENANT_FEATURE_REQUIREMENTS).map(
  ([key, value]) => ({
    key,
    ...value,
  })
);

const MODULE_CONFIG = {
  reports: {
    label: 'Relatórios avançados',
    flagKey: 'enableReports',
    rawKey: 'reports_enabled',
  },
  pwa_admin: {
    label: 'Painel administrativo (PWA)',
    flagKey: 'enableAdminPwa',
    rawKey: 'pwa_admin_enabled',
  },
  pwa_client: {
    label: 'PWA Cliente',
    flagKey: 'enableCustomerPwa',
    rawKey: 'pwa_client_enabled',
  },
  rn_admin: {
    label: 'App Admin (React Native)',
    flagKey: 'enableNativeAdmin',
    rawKey: 'rn_admin_enabled',
  },
  rn_client: {
    label: 'App Cliente (React Native)',
    flagKey: 'enableNativeClient',
    rawKey: 'rn_client_enabled',
  },
};

const resolveModuleLabel = (moduleKey) =>
  MODULE_CONFIG[moduleKey]?.label || moduleKey;

const CHANNEL_CONFIG = [
  { key: 'email', defaultLabel: 'Email' },
  { key: 'sms', defaultLabel: 'SMS' },
  { key: 'whatsapp', defaultLabel: 'WhatsApp' },
  { key: 'push_web', defaultLabel: 'Web Push' },
  { key: 'push_mobile', defaultLabel: 'Mobile Push' },
];

function buildInitialSettings(profile, channels, branding) {
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
  };
}

function Settings() {
  const { t } = useTranslation();
  const {
    tenant,
    plan,
    modules,
    channels,
    flags,
    featureFlagsRaw,
    profile,
    branding,
    loading: tenantLoading,
    error: tenantError,
    slug,
    applyTenantBootstrap,
    refetch,
  } = useTenant();
  const [activeTab, setActiveTab] = useState('branding');
  const {
    balance,
    loading: creditLoading,
    error: creditError,
    refresh: refreshCredits,
  } = useCreditBalance();
  const { overview: billingOverview } = useBillingOverview();
  // SSE desativado: atualização manual via badge (CreditBadge)

  const initialSettings = useMemo(
    () => buildInitialSettings(profile, channels, branding),
    [profile, channels, branding]
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
  const [autoInviteError, setAutoInviteError] = useState(null);
  const [autoInviteSuccess, setAutoInviteSuccess] = useState('');

  useEffect(() => {
    setSettings(initialSettings);
    setBrandingFile(null);
    setBrandingSuccess('');
    setBrandingError(null);
  }, [initialSettings]);

  useEffect(() => {
    setAutoInviteEnabled(Boolean(tenant?.auto_invite_enabled));
  }, [tenant?.auto_invite_enabled]);

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

  const planName = useMemo(() => resolvePlanName(plan), [plan]);
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

      // Sem informação explícita -> seguir plano (já presente no set)
      return true;
    });
  }, [plan, modules, flags, featureFlagsRaw]);

  const channelCards = useMemo(
    () =>
      CHANNEL_CONFIG.map(({ key, defaultLabel }) => ({
        key,
        label: t(`settings.channels.${key}`, defaultLabel),
        enabled: Boolean(channels?.[key]),
      })),
    [channels, t]
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

  const hasFlagData = useMemo(
    () => flags && typeof flags === 'object' && Object.keys(flags).length > 0,
    [flags]
  );

  const activeFeatures = useMemo(() => {
    if (!hasFlagData) return [];
    return FEATURE_LIST.filter(({ key }) => flags?.[key]);
  }, [flags, hasFlagData]);

  const lockedFeatures = useMemo(() => {
    return FEATURE_LIST.filter(({ requiredPlan }) => {
      if (!requiredPlan) {
        return false;
      }

      return comparePlanTiers(requiredPlan, planTier) === -1;
    });
  }, [planTier]);

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

  const refreshTenantData = useCallback(async () => {
    let refreshed = false;

    if (slug) {
      try {
        const metaResponse = await fetchTenantMeta(slug);
        if (metaResponse?.data) {
          applyTenantBootstrap({
            ...(metaResponse.data || {}),
            slug,
          });
          refreshed = true;
        }
      } catch (metaError) {
        console.warn('[Settings] fetchTenantMeta refresh falhou:', metaError);
      }
    }

    if (!refreshed) {
      try {
        const bootstrap = await fetchTenantBootstrap();
        if (bootstrap?.slug) {
          applyTenantBootstrap(bootstrap);
          refreshed = true;
        }
      } catch (bootstrapError) {
        console.warn(
          '[Settings] fetchTenantBootstrap refresh falhou:',
          bootstrapError
        );
      }
    }

    if (!refreshed) {
      try {
        await refetch();
        refreshed = true;
      } catch (refetchError) {
        console.warn('[Settings] refetch fallback falhou:', refetchError);
      }
    }

    return refreshed;
  }, [applyTenantBootstrap, refetch, slug]);

  const handleBrandingSave = useCallback(async () => {
    setBrandingSaving(true);
    setBrandingError(null);
    setBrandingSuccess('');

    try {
      await updateTenantBranding({
        logoFile: brandingFile,
        logoUrl: brandingFile ? undefined : settings.branding.logoUrl,
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
  }, [brandingFile, refreshTenantData, settings.branding.logoUrl, t]);

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
    setAutoInviteError(null);
    setAutoInviteSuccess('');

    try {
      await updateTenantAutoInvite(nextValue);
      await refreshTenantData();
      const successMessage = nextValue
        ? t(
            'settings.auto_invite.success_enabled',
            'Convites automáticos ativados.'
          )
        : t(
            'settings.auto_invite.success_disabled',
            'Convites automáticos desativados.'
          );
      setAutoInviteSuccess(successMessage);
    } catch (err) {
      const parsed = parseApiError(
        err,
        t(
          'settings.auto_invite.error',
          'Não foi possível atualizar a preferência.'
        )
      );
      setAutoInviteError(parsed);
      setAutoInviteEnabled(!nextValue);
    } finally {
      setAutoInviteSaving(false);
    }
  }, [
    autoInviteEnabled,
    autoInviteSaving,
    canToggleAutoInvite,
    refreshTenantData,
    t,
    tenantLoading,
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
          {tenantLoading ? (
            <p className="mt-1 text-xs text-brand-surfaceForeground/60">
              {t('common.loading_data', 'Carregando dados do plano...')}
            </p>
          ) : null}
        </div>

        {activeFeatures.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {activeFeatures.map(({ key, label }) => (
              <span
                key={key}
                className="rounded-full border border-brand-border bg-brand-light px-3 py-1 text-xs font-medium text-brand-surfaceForeground"
              >
                {label}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-6 space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-brand-surfaceForeground">
            {t('settings.plan_modules', 'Módulos incluídos')}
          </h4>
          {moduleList.length ? (
            <ul className="mt-2 space-y-1 text-sm text-brand-surfaceForeground/80">
              {moduleList.map((module) => {
                const label = resolveModuleLabel(module);
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

        <div>
          <h4 className="text-sm font-semibold text-brand-surfaceForeground">
            {t('settings.locked_features', 'Recursos bloqueados')}
          </h4>
          {hasFlagData ? (
            lockedFeatures.length ? (
              <ul className="mt-2 space-y-2 text-sm text-amber-700">
                {lockedFeatures.map(({ key, label }) => {
                  const requirement = describeFeatureRequirement(key, planName);
                  return (
                    <li
                      key={key}
                      className="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2"
                    >
                      <strong>{label}</strong>
                      {requirement.requiredPlan
                        ? ` — ${t('settings.requires_plan', 'Requer plano')} ${requirement.requiredPlan}.`
                        : ''}{' '}
                      {requirement.description}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-brand-surfaceForeground/60">
                {t(
                  'settings.locked_features_empty',
                  'Nenhum recurso bloqueado para este plano.'
                )}
              </p>
            )
          ) : (
            <p className="mt-2 text-sm text-brand-surfaceForeground/60">
              {t(
                'settings.locked_features_unavailable',
                'Sem dados de recursos do plano no momento. Tente atualizar a página.'
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
            Escolher arquivo
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

    if (sanitizedProfile.address) {
      cardItems.push({
        key: 'address',
        label: t('settings.general.address', 'Endereço'),
        value: sanitizedProfile.address,
      });
    }

    return (
      <div className="space-y-4">
        {tenantLoading ? (
          <p className="text-sm text-brand-surfaceForeground/60">
            {t('common.loading_data', 'Carregando dados...')}
          </p>
        ) : null}

        {cardItems.length ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {cardItems.map(({ key, label, value }) =>
              renderInfoCard(label, formatValue(value), key)
            )}
          </div>
        ) : (
          <p className="text-sm text-brand-surfaceForeground/60">
            {t(
              'settings.general.empty',
              'Nenhuma informação geral disponível para este salão.'
            )}
          </p>
        )}

        <p className="text-xs text-brand-surfaceForeground/60">
          {t(
            'settings.readonly_hint',
            'Edição disponível em tarefas futuras (ver backlog de Settings).'
          )}
        </p>
      </div>
    );
  };

  const renderNotificationSettings = () => (
    <div className="space-y-4">
      {tenantLoading ? (
        <p className="text-sm text-brand-surfaceForeground/60">
          {t('common.loading_data', 'Carregando dados...')}
        </p>
      ) : null}

      <PlanGate featureKey="enableCustomerPwa">
        <div className="rounded-lg border border-brand-border bg-brand-surface/70 px-4 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <p
                title={t(
                  'settings.auto_invite.title',
                  'Convites automáticos do PWA Cliente'
                )}
                className="text-sm font-semibold text-brand-surfaceForeground"
              >
                {t(
                  'settings.auto_invite.title',
                  'Convites automáticos do PWA Cliente'
                )}
              </p>
              <p
                title={t(
                  'settings.auto_invite.description',
                  'Envie convites automáticos para novos clientes com email válido ao habilitar o PWA Cliente.'
                )}
                className="mt-1 text-sm text-brand-surfaceForeground/80"
              >
                {t(
                  'settings.auto_invite.description',
                  'Envie convites automáticos para novos clientes com email válido ao habilitar o PWA Cliente.'
                )}
              </p>
              {!canToggleAutoInvite ? (
                <p className="mt-2 text-xs text-brand-surfaceForeground/60">
                  {t(
                    'settings.auto_invite.blocked_hint',
                    'Disponível apenas quando o PWA Cliente está habilitado para o salão.'
                  )}
                </p>
              ) : null}
              {autoInviteSaving ? (
                <p className="mt-2 text-xs text-brand-surfaceForeground/60">
                  {t('common.saving', 'Salvando...')}
                </p>
              ) : null}
              {autoInviteSuccess ? (
                <p className="mt-2 text-xs text-emerald-600">
                  {autoInviteSuccess}
                </p>
              ) : null}
              {autoInviteError ? (
                <p className="mt-2 text-xs text-rose-600">{autoInviteError}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              <span
                title={
                  autoInviteEnabled
                    ? t('settings.auto_invite.status_enabled', 'Ativo')
                    : t('settings.auto_invite.status_disabled', 'Inativo')
                }
                className={`text-sm font-medium ${
                  autoInviteEnabled
                    ? 'text-emerald-600'
                    : 'text-brand-surfaceForeground/60'
                }`}
              >
                {autoInviteEnabled
                  ? t('settings.auto_invite.status_enabled', 'Ativo')
                  : t('settings.auto_invite.status_disabled', 'Inativo')}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={autoInviteEnabled}
                aria-label={t(
                  'settings.auto_invite.accessible_label',
                  'Alternar convites automáticos do PWA'
                )}
                onClick={handleAutoInviteToggle}
                disabled={
                  autoInviteSaving || tenantLoading || !canToggleAutoInvite
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoInviteEnabled ? 'bg-brand-primary' : 'bg-gray-300'
                } ${
                  autoInviteSaving || tenantLoading || !canToggleAutoInvite
                    ? 'cursor-not-allowed opacity-60'
                    : 'cursor-pointer'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    autoInviteEnabled ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </PlanGate>

      <div className="grid gap-4 sm:grid-cols-2">
        {channelCards.map(({ key, label, enabled }) => (
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
                enabled
                  ? t('settings.channel_enabled', 'Ativo')
                  : t('settings.channel_disabled', 'Indisponível')
              }
              className="mt-1 text-sm text-brand-surfaceForeground"
            >
              {enabled
                ? t('settings.channel_enabled', 'Ativo')
                : t('settings.channel_disabled', 'Indisponível')}
            </p>
          </div>
        ))}
      </div>

      {!smsAvailable || !whatsappAvailable ? (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-brand-border bg-brand-light px-4 py-3 text-brand-surfaceForeground">
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
                  onClick={() => window.location.assign('/plans')}
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
      ) : null}

      <p className="text-xs text-brand-surfaceForeground/60">
        {t(
          'settings.notifications_readonly_hint',
          'Gestão fina de canais/alertas ficará disponível em issues específicas (FEW-245/246).'
        )}
      </p>
    </div>
  );

  const renderBusinessSettings = () => {
    return (
      <div className="space-y-4">
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
  };

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
        <button
          type="button"
          onClick={() => window.location.assign('/plans')}
          className="rounded-full border border-brand-border bg-brand-light px-3 py-1 text-xs font-medium text-brand-surfaceForeground"
        >
          {t('settings.manage_plan', 'Gerir plano')}
        </button>
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
                    onClick={() => setActiveTab(tab.id)}
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
            </Card>
          </div>
        </div>
      </div>
    </FullPageLayout>
  );
}

export default Settings;
