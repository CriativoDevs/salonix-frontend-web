import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import FullPageLayout from '../layouts/FullPageLayout';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import FormButton from '../components/ui/FormButton';

function Settings() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    general: {
      businessName: 'Salão Elegante',
      email: 'contato@salaoelegante.com',
      phone: '+351 912 345 678',
      address: 'Rua das Flores, 123, Porto',
      timezone: 'Europe/Lisbon',
      language: 'pt',
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      appointmentReminders: true,
      marketingEmails: false,
    },
    business: {
      workingHours: {
        monday: { open: '09:00', close: '18:00', closed: false },
        tuesday: { open: '09:00', close: '18:00', closed: false },
        wednesday: { open: '09:00', close: '18:00', closed: false },
        thursday: { open: '09:00', close: '18:00', closed: false },
        friday: { open: '09:00', close: '18:00', closed: false },
        saturday: { open: '09:00', close: '16:00', closed: false },
        sunday: { open: '09:00', close: '16:00', closed: true },
      },
      appointmentDuration: 60,
      bufferTime: 15,
    },
  });

  const tabs = [
    { id: 'general', label: 'settings.tabs.general', icon: '⚙️' },
    { id: 'notifications', label: 'settings.tabs.notifications', icon: '🔔' },
    { id: 'business', label: 'settings.tabs.business', icon: '🏢' },
  ];

  const handleSave = (section) => {
    // TODO: implementar salvamento das configurações
    console.log(`Salvando configurações de ${section}:`, settings[section]);
  };

  const renderGeneralSettings = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">
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
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">
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
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">
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
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">
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
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <FormButton
        onClick={() => handleSave('general')}
        variant="primary"
        className="w-full"
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
            className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
          />
        </div>
      ))}

      <FormButton
        onClick={() => handleSave('notifications')}
        variant="primary"
        className="w-full"
      >
        {t('settings.save')}
      </FormButton>
    </div>
  );

  const renderBusinessSettings = () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-lg font-medium text-gray-900 mb-3">
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
                  className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
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
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
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
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
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
                  appointmentDuration: parseInt(e.target.value),
                },
              })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
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
                  bufferTime: parseInt(e.target.value),
                },
              })
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      <FormButton
        onClick={() => handleSave('business')}
        variant="primary"
        className="w-full"
      >
        {t('settings.save')}
      </FormButton>
    </div>
  );

  return (
    <FullPageLayout>
      <PageHeader
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
      />

      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar de abas */}
          <div className="lg:col-span-1">
            <Card className="p-4">
              <nav className="space-y-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-brand-100 text-brand-700 border border-brand-200'
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

          {/* Conteúdo da aba ativa */}
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
