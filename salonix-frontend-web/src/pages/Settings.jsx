import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import FullPageLayout from '../layouts/FullPageLayout';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import FormButton from '../components/ui/FormButton';
import { useTenant } from '../hooks/useTenant';
import { DEFAULT_TENANT_META } from '../utils/tenant';
import {
  TENANT_FEATURE_REQUIREMENTS,
  describeFeatureRequirement,
} from '../constants/tenantFeatures';

const TAB_ITEMS = [
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

function buildInitialSettings(profile, channels) {
  const safeProfile = { ...DEFAULT_TENANT_META.profile, ...(profile || {}) };
  const safeChannels = { ...DEFAULT_TENANT_META.channels, ...(channels || {}) };

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
    loading: tenantLoading,
  } = useTenant();
  const [activeTab, setActiveTab] = useState('general');

  const initialSettings = useMemo(
    () => buildInitialSettings(profile, channels),
    [profile, channels]
  );

  const [settings, setSettings] = useState(initialSettings);

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

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

  const handleSave = (section) => {
    // TODO: integrar com endpoint de atualização
    console.log(`Salvando configurações de ${section}:`, settings[section]);
  };

  const renderPlanSummary = () => (
    <Card className="p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {t('settings.plan_title', 'Plano atual')}
          </h3>
          <p className="text-sm text-gray-600">
            {plan?.name || t('settings.plan_unknown', 'Plano não identificado')}
          </p>
        </div>

        {activeFeatures.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {activeFeatures.map(({ key, label }) => (
              <span
                key={key}
                className="rounded-full border border-brand-border bg-brand-light px-3 py-1 text-xs font-medium text-gray-700"
              >
                {label}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">
            {t('settings.plan_modules', 'Módulos incluídos')}
          </h4>
          {moduleList.length ? (
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              {moduleList.map((module) => (
                <li key={module}>• {module}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-gray-500">
              {t(
                'settings.plan_modules_empty',
                'Nenhum módulo adicional definido para este plano.'
              )}
            </p>
          )}
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-900">
            {t('settings.plan_channels', 'Canais ativos')}
          </h4>
          {channelEntries.length ? (
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              {channelEntries.map(([channelKey, enabled]) => (
                <li key={channelKey} className={enabled ? '' : 'text-gray-400'}>
                  • {channelKey.toUpperCase()}{' '}
                  {enabled ? '— ativo' : '— indisponível'}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-gray-500">
              {t(
                'settings.plan_channels_empty',
                'Sem informações de canais para este tenant.'
              )}
            </p>
          )}
        </div>

        {lockedFeatures.length ? (
          <div className="sm:col-span-2">
            <h4 className="text-sm font-semibold text-gray-900">
              {t('settings.locked_features', 'Recursos bloqueados')}
            </h4>
            <ul className="mt-2 space-y-2 text-sm text-amber-700">
              {lockedFeatures.map(({ key, label }) => {
                const requirement = describeFeatureRequirement(key, plan?.name);
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

  const renderGeneralSettings = () => (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-900">
          {t('settings.business_name')}
        </label>
        <input
          type="text"
          value={settings.general.businessName}
          onChange={(e) =>
            setSettings({
              ...settings,
              general: { ...settings.general, businessName: e.target.value },
            })
          }
          disabled={tenantLoading}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-900">
          {t('settings.email')}
        </label>
        <input
          type="email"
          value={settings.general.email}
          onChange={(e) =>
            setSettings({
              ...settings,
              general: { ...settings.general, email: e.target.value },
            })
          }
          disabled={tenantLoading}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-900">
          {t('settings.phone')}
        </label>
        <input
          type="tel"
          value={settings.general.phone}
          onChange={(e) =>
            setSettings({
              ...settings,
              general: { ...settings.general, phone: e.target.value },
            })
          }
          disabled={tenantLoading}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-900">
          {t('settings.address')}
        </label>
        <textarea
          value={settings.general.address}
          onChange={(e) =>
            setSettings({
              ...settings,
              general: { ...settings.general, address: e.target.value },
            })
          }
          rows={2}
          disabled={tenantLoading}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <FormButton
        onClick={() => handleSave('general')}
        variant="primary"
        className="w-full"
        disabled={tenantLoading}
      >
        {t('settings.save')}
      </FormButton>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-4">
      {Object.entries(settings.notifications).map(([key, value]) => (
        <div key={key} className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-900">
              {t(`settings.notifications.${key}`)}
            </label>
            <p className="text-sm text-gray-500">
              {t(`settings.notifications.${key}_description`)}
            </p>
          </div>
          <input
            type="checkbox"
            checked={value}
            onChange={(e) =>
              setSettings({
                ...settings,
                notifications: {
                  ...settings.notifications,
                  [key]: e.target.checked,
                },
              })
            }
            disabled={tenantLoading}
            className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
        </div>
      ))}

      {flags?.enableWebPush === false ? (
        <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          {describeFeatureRequirement('enableWebPush', plan?.name).description}
        </div>
      ) : null}

      <FormButton
        onClick={() => handleSave('notifications')}
        variant="primary"
        className="w-full"
        disabled={tenantLoading}
      >
        {t('settings.save')}
      </FormButton>
    </div>
  );

  const renderBusinessSettings = () => (
    <div className="space-y-6">
      <div>
        <h4 className="mb-3 text-lg font-medium text-gray-900">
          {t('settings.working_hours')}
        </h4>
        <div className="space-y-3">
          {Object.entries(settings.business.workingHours).map(
            ([day, hours]) => (
              <div key={day} className="flex items-center space-x-4">
                <div className="w-24">
                  <span className="text-sm font-medium text-gray-900">
                    {t(`settings.days.${day}`)}
                  </span>
                </div>

                <input
                  type="checkbox"
                  checked={!hours.closed}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      business: {
                        ...settings.business,
                        workingHours: {
                          ...settings.business.workingHours,
                          [day]: { ...hours, closed: !e.target.checked },
                        },
                      },
                    })
                  }
                  disabled={tenantLoading}
                  className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                />

                {!hours.closed && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="time"
                      value={hours.open}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          business: {
                            ...settings.business,
                            workingHours: {
                              ...settings.business.workingHours,
                              [day]: { ...hours, open: e.target.value },
                            },
                          },
                        })
                      }
                      disabled={tenantLoading}
                      className="rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="time"
                      value={hours.close}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          business: {
                            ...settings.business,
                            workingHours: {
                              ...settings.business.workingHours,
                              [day]: { ...hours, close: e.target.value },
                            },
                          },
                        })
                      }
                      disabled={tenantLoading}
                      className="rounded border border-gray-300 px-2 py-1 text-sm"
                    />
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900">
            {t('settings.appointment_duration')} (min)
          </label>
          <input
            type="number"
            value={settings.business.appointmentDuration}
            onChange={(e) =>
              setSettings({
                ...settings,
                business: {
                  ...settings.business,
                  appointmentDuration: Number.parseInt(e.target.value, 10) || 0,
                },
              })
            }
            disabled={tenantLoading}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-900">
            {t('settings.buffer_time')} (min)
          </label>
          <input
            type="number"
            value={settings.business.bufferTime}
            onChange={(e) =>
              setSettings({
                ...settings,
                business: {
                  ...settings.business,
                  bufferTime: Number.parseInt(e.target.value, 10) || 0,
                },
              })
            }
            disabled={tenantLoading}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      <FormButton
        onClick={() => handleSave('business')}
        variant="primary"
        className="w-full"
        disabled={tenantLoading}
      >
        {t('settings.save')}
      </FormButton>
    </div>
  );

  return (
    <FullPageLayout>
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')}>
        {plan?.name ? (
          <span className="rounded-full border border-brand-border bg-brand-light px-3 py-1 text-xs font-medium text-gray-700">
            {t('settings.plan_badge', 'Plano')}: {plan.name}
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
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
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
            <Card className="p-6">
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
