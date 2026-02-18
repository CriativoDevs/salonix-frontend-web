import React, { useEffect } from 'react';
import { useOpsMetrics } from '../../hooks/useOpsMetrics';
import { useOpsAlerts } from '../../hooks/useOpsAlerts';
import {
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Activity,
  Users,
  DollarSign,
  Bell,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const OpsDashboard = () => {
  const { metrics, loading: metricsLoading, loadMetrics } = useOpsMetrics();
  const { alerts, loading: alertsLoading, listAlerts } = useOpsAlerts();

  useEffect(() => {
    loadMetrics();
    listAlerts({ resolved: false });
  }, [loadMetrics, listAlerts]);

  if (metricsLoading && !metrics) {
    return <div className="text-white p-6">Carregando dashboard...</div>;
  }

  if (!metrics) {
    return null;
  }

  const {
    totals = {},
    mrr_estimated = {},
    notification_daily = [],
  } = metrics || {};

  console.log('OpsDashboard render:', { metrics, mrr_estimated });

  // Safe access helpers
  const getCount = (type) => mrr_estimated?.breakdown?.[type]?.count || 0;
  const proCount = getCount('pro');
  const stdCount = getCount('standard');
  const basicCount = getCount('basic');

  // Encontrar o valor máximo para escalar o gráfico
  const maxNotifications = Math.max(
    ...(notification_daily || []).map((d) => d.total),
    10 // Mínimo de escala
  );

  return (
    <div className="space-y-6">
      {/* Header com Refresh */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Visão Geral</h1>
        <button
          onClick={() => {
            loadMetrics();
            listAlerts({ resolved: false });
          }}
          className="p-2 bg-gray-800 text-gray-400 rounded hover:text-white transition-colors"
          title="Atualizar dados"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-medium">Total Tenants</h3>
            <Users size={16} className="text-gray-500" />
          </div>
          <p className="text-3xl font-bold text-white">
            {totals.active_tenants || 0}
          </p>
          <div className="mt-2 text-yellow-400 text-xs flex items-center">
            <span>{totals.trials_expiring_7d || 0} trials expirando em 7d</span>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-medium">MRR Estimado</h3>
            <DollarSign size={16} className="text-gray-500" />
          </div>
          <p className="text-3xl font-bold text-white">
            € {mrr_estimated.total || 0}
          </p>
          <div className="mt-2 text-gray-500 text-xs">
            {proCount} Pro · {stdCount} Std · {basicCount} Basic
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-medium">
              Alertas Abertos
            </h3>
            <AlertTriangle size={16} className="text-red-500" />
          </div>
          <p className="text-3xl font-bold text-white">
            {totals.alerts_open || 0}
          </p>
          <div className="mt-2 text-gray-500 text-xs flex items-center">
            <Link to="/ops/support" className="hover:text-purple-400">
              Ver todos &rarr;
            </Link>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-400 text-sm font-medium">
              Notificações (24h)
            </h3>
            <Bell size={16} className="text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-white">
            {notification_daily.length > 0
              ? notification_daily[notification_daily.length - 1].total
              : 0}
          </p>
          <div className="mt-2 text-green-400 text-xs">
            Entregues com sucesso
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de Notificações */}
        <div className="lg:col-span-2 bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Activity size={20} />
            Volume de Notificações (7 dias)
          </h2>

          <div className="h-48 flex items-end justify-between gap-2">
            {notification_daily.map((day) => {
              const heightPercent = (day.total / maxNotifications) * 100;
              const dateLabel = new Date(day.date).toLocaleDateString(
                undefined,
                { weekday: 'short', day: 'numeric' }
              );

              return (
                <div
                  key={day.date}
                  className="flex flex-col items-center flex-1 group relative"
                >
                  <div
                    className="w-full bg-gray-700 rounded-t hover:bg-purple-900 transition-colors relative"
                    style={{ height: `${heightPercent}%`, minHeight: '4px' }}
                  >
                    <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10 pointer-events-none">
                      {day.total} msgs
                      <br />
                      SMS: {day.channels?.sms || 0} | WA:{' '}
                      {day.channels?.whatsapp || 0}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 mt-2 rotate-0 text-center">
                    {dateLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alertas Recentes */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <AlertTriangle size={20} />
              Alertas Recentes
            </h2>
            <Link
              to="/ops/support"
              className="text-xs text-purple-400 hover:text-purple-300"
            >
              Ver Central
            </Link>
          </div>

          <div className="space-y-4">
            {alertsLoading && (
              <div className="text-gray-500 text-sm">Carregando alertas...</div>
            )}

            {!alertsLoading && alerts.length === 0 && (
              <div className="text-gray-500 text-sm text-center py-8">
                <CheckCircle
                  size={32}
                  className="mx-auto mb-2 text-green-500 opacity-50"
                />
                Nenhum alerta pendente.
              </div>
            )}

            {alerts.slice(0, 5).map((alert) => (
              <div
                key={alert.id}
                className="bg-gray-900/50 p-3 rounded border border-gray-700/50 hover:border-gray-600 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <span
                    className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                      alert.severity === 'critical'
                        ? 'bg-red-900 text-red-200'
                        : alert.severity === 'warning'
                          ? 'bg-yellow-900 text-yellow-200'
                          : 'bg-blue-900 text-blue-200'
                    }`}
                  >
                    {alert.severity.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(alert.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-300 mt-1 line-clamp-2">
                  {alert.message}
                </p>
                <div className="mt-2 text-xs text-gray-500">
                  {alert.tenant ? `Tenant: ${alert.tenant.name}` : 'Sistema'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpsDashboard;
