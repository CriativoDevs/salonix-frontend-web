import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import FullPageLayout from '../layouts/FullPageLayout';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import FormButton from '../components/ui/FormButton';
import { useTenant } from '../hooks/useTenant';
import { DEFAULT_TENANT_META, resolveTenantAssetUrl } from '../utils/tenant';
import { parseApiError } from '../utils/apiError';
import { fetchTenantMeta, updateTenantBranding } from '../api/tenant';
import { fetchTenantBootstrap } from '../api/auth';
import {
  TENANT_FEATURE_REQUIREMENTS,
  describeFeatureRequirement,
} from '../constants/tenantFeatures';

const TAB_ITEMS = [
  { id: 'branding', label: 'settings.tabs.branding', icon: '🎨' },
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

const PLAN_LABELS = {
  starter: 'Starter',
  basic: 'Basic',
  standard: 'Standard',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

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
      primaryColor: safeBranding.primaryColor || '#6B7280',
      secondaryColor: safeBranding.secondaryColor || '#1F2937',
      logoUrl: safeBranding.logoUrl || '',
    },
  };
}

function Settings() {
  const { t } = useTranslation();
  const {
    plan,
    modules,
    channels,
    flags,
    profile,
    branding,
    loading: tenantLoading,
    slug,
    applyTenantBootstrap,
    refetch,
  } = useTenant();
  const [activeTab, setActiveTab] = useState('branding');

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

  useEffect(() => {
    setSettings(initialSettings);
    setBrandingFile(null);
    setBrandingSuccess('');
    setBrandingError(null);
  }, [initialSettings]);

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

  const planTier = plan?.tier || plan?.code || DEFAULT_TENANT_META.plan.code;
  const planName = plan?.name || PLAN_LABELS[planTier] || PLAN_LABELS.starter;

  const moduleList = useMemo(() => {
    if (Array.isArray(modules) && modules.length > 0) {
      return modules;
    }
    if (Array.isArray(plan?.features) && plan.features.length > 0) {
      return plan.features;
    }
    return [];
  }, [modules, plan]);

  const channelEntries = useMemo(
    () => Object.entries(channels || {}),
    [channels]
  );
  const activeFeatures = useMemo(
    () => FEATURE_LIST.filter(({ key }) => flags?.[key]),
    [flags]
  );
  const lockedFeatures = useMemo(
    () => FEATURE_LIST.filter(({ key }) => flags?.[key] === false),
    [flags]
  );

  const handleBrandingSave = useCallback(async () => {
    setBrandingSaving(true);
    setBrandingError(null);
    setBrandingSuccess('');

    try {
      await updateTenantBranding({
        primaryColor: settings.branding.primaryColor,
        secondaryColor: settings.branding.secondaryColor,
        logoFile: brandingFile,
        logoUrl: brandingFile ? undefined : settings.branding.logoUrl,
      });

      let refreshed = false;

      try {
        if (slug) {
          const metaResponse = await fetchTenantMeta(slug);
          if (metaResponse?.data) {
            applyTenantBootstrap({
              ...(metaResponse.data || {}),
              slug,
            });
            refreshed = true;
          }
        }
      } catch (metaError) {
        console.warn('[Settings] fetchTenantMeta pós-branding falhou:', metaError);
      }

      if (!refreshed) {
        try {
          const bootstrap = await fetchTenantBootstrap();
          if (bootstrap?.slug) {
            applyTenantBootstrap(bootstrap);
            refreshed = true;
          }
        } catch (bootstrapError) {
          console.warn('[Settings] fetchTenantBootstrap fallback falhou:', bootstrapError);
        }
      }

      if (!refreshed) {
        await refetch();
      }

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
    applyTenantBootstrap,
    brandingFile,
    refetch,
    settings.branding.logoUrl,
    settings.branding.primaryColor,
    settings.branding.secondaryColor,
    slug,
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

  const handleLogoUrlChange = (event) => {
    const value = event.target.value;
    setBrandingFile(null);
    setSettings({
      ...settings,
      branding: { ...settings.branding, logoUrl: value },
    });
  };

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

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <h4 className="text-sm font-semibold text-brand-surfaceForeground">
            {t('settings.plan_modules', 'Módulos incluídos')}
          </h4>
          {moduleList.length ? (
            <ul className="mt-2 space-y-1 text-sm text-brand-surfaceForeground/80">
              {moduleList.map((module) => (
                <li key={module}>• {module}</li>
              ))}
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
            {t('settings.plan_channels', 'Canais ativos')}
          </h4>
          {channelEntries.length ? (
            <ul className="mt-2 space-y-1 text-sm text-brand-surfaceForeground/80">
              {channelEntries.map(([channelKey, enabled]) => (
                <li key={channelKey} className={enabled ? '' : 'text-brand-surfaceForeground/50'}>
                  • {channelKey.toUpperCase()}{' '}
                  {enabled ? '— ativo' : '— indisponível'}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-brand-surfaceForeground/60">
              {t(
                'settings.plan_channels_empty',
                'Sem informações de canais para este tenant.'
              )}
            </p>
          )}
        </div>

        {lockedFeatures.length ? (
          <div className="sm:col-span-2">
            <h4 className="text-sm font-semibold text-brand-surfaceForeground">
              {t('settings.locked_features', 'Recursos bloqueados')}
            </h4>
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
                      ? ` — Requer plano ${requirement.requiredPlan}.`
                      : ''}{' '}
                    {requirement.description}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </div>
    </Card>
  );

  const renderBrandingSettings = () => (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-brand-surfaceForeground">
            {t('settings.branding.primary_color', 'Cor primária')}
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={settings.branding.primaryColor}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  branding: { ...settings.branding, primaryColor: e.target.value },
                })
              }
              disabled={tenantLoading}
              className="h-10 w-16 cursor-pointer"
            />
            <input
              type="text"
              value={settings.branding.primaryColor}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  branding: { ...settings.branding, primaryColor: e.target.value },
                })
              }
              disabled={tenantLoading}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-brand-surfaceForeground">
            {t('settings.branding.secondary_color', 'Cor secundária')}
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={settings.branding.secondaryColor}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  branding: { ...settings.branding, secondaryColor: e.target.value },
                })
              }
              disabled={tenantLoading}
              className="h-10 w-16 cursor-pointer"
            />
            <input
              type="text"
              value={settings.branding.secondaryColor}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  branding: { ...settings.branding, secondaryColor: e.target.value },
                })
              }
              disabled={tenantLoading}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>
        </div>
      </div>

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
          <input
            type="file"
            accept="image/png,image/jpeg,image/svg+xml"
            onChange={handleLogoFileChange}
            disabled={tenantLoading}
            className="text-sm"
          />
          <span className="text-xs text-brand-surfaceForeground/60">
            {t('settings.branding.logo_info', 'PNG, JPG ou SVG até 2MB. Enviar um arquivo substitui a URL do logo.')}
          </span>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-brand-surfaceForeground">
            {t('settings.branding.logo_url', 'URL do logo')}
          </label>
          <input
            type="url"
            value={settings.branding.logoUrl}
            onChange={handleLogoUrlChange}
            disabled={tenantLoading}
            placeholder="https://..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </div>
      </div>

      {brandingError ? (
        <p className="text-sm text-red-600">{brandingError.message}</p>
      ) : null}
      {brandingSuccess ? (
        <p className="text-sm text-emerald-600">{brandingSuccess}</p>
      ) : null}

      <FormButton
        onClick={handleBrandingSave}
        variant="primary"
        className="w-full"
        disabled={tenantLoading || brandingSaving}
      >
        {brandingSaving ? t('common.saving', 'Salvando...') : t('settings.save')}
      </FormButton>
    </div>
  );

  const renderGeneralSettings = () => (
    <div className="space-y-4">
      <p className="text-sm text-brand-surfaceForeground/60">
        {t('settings.coming_soon_hint', 'Integração disponível em breve.')}
      </p>
      <FormButton variant="outline" disabled className="w-full">
        {t('settings.coming_soon', 'Em breve')}
      </FormButton>
    </div>
  );

  const renderNotificationSettings = renderGeneralSettings;
  const renderBusinessSettings = renderGeneralSettings;

  return (
    <FullPageLayout>
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')}>
        {planName ? (
          <span className="rounded-full border border-brand-border bg-brand-light px-3 py-1 text-xs font-medium text-brand-surfaceForeground">
            {t('settings.plan_badge', 'Plano')}: {planName}
          </span>
        ) : null}
      </PageHeader>

      <div className="mx-auto flex max-w-4xl flex-col gap-6">
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
            <Card className="p-6 bg-brand-surface text-brand-surfaceForeground">
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
