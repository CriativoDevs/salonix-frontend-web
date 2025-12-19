import React, { useState, useEffect } from 'react';
import { useOpsAlerts } from '../../hooks/useOpsAlerts';
import { useOpsSupport } from '../../hooks/useOpsSupport';
import {
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Search,
  MessageSquare,
  Unlock,
  Filter,
} from 'lucide-react';

const OpsSupport = () => {
  const {
    alerts,
    loading: alertsLoading,
    listAlerts,
    resolveAlert,
  } = useOpsAlerts();
  const {
    resendNotification,
    clearLockout,
    loading: supportLoading,
  } = useOpsSupport();

  const [filterResolved, setFilterResolved] = useState(false);
  const [notificationId, setNotificationId] = useState('');
  const [lockoutId, setLockoutId] = useState('');
  const [lockoutNote, setLockoutNote] = useState('');

  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    listAlerts({ resolved: filterResolved });
  }, [listAlerts, filterResolved]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!notificationId) return;
    try {
      await resendNotification(notificationId);
      setActionMessage({
        type: 'success',
        text: `Notificação ${notificationId} reenviada com sucesso!`,
      });
      setNotificationId('');
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (!lockoutId) return;
    try {
      await clearLockout(lockoutId, lockoutNote);
      setActionMessage({
        type: 'success',
        text: `Bloqueio ${lockoutId} removido com sucesso!`,
      });
      setLockoutId('');
      setLockoutNote('');
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    }
  };

  const handleResolveAlert = async (id) => {
    if (!window.confirm('Marcar este alerta como resolvido?')) return;
    try {
      await resolveAlert(id);
    } catch (err) {
      console.error(err);
      alert('Erro ao resolver alerta');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Central de Suporte</h1>
      </div>

      {actionMessage.text && (
        <div
          className={`p-4 rounded border ${
            actionMessage.type === 'success'
              ? 'bg-green-900/50 border-green-700 text-green-200'
              : 'bg-red-900/50 border-red-700 text-red-200'
          }`}
        >
          {actionMessage.text}
          <button
            onClick={() => setActionMessage({ type: '', text: '' })}
            className="float-right font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Ferramentas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <MessageSquare size={20} />
            Reenviar Notificação
          </h2>
          <form onSubmit={handleResend} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                ID da Notificação (Log)
              </label>
              <input
                type="number"
                min="1"
                value={notificationId}
                onChange={(e) => setNotificationId(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:ring-purple-500 focus:border-purple-500"
                placeholder="Ex: 12345"
                required
              />
            </div>
            <button
              type="submit"
              disabled={supportLoading}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors disabled:opacity-50"
            >
              {supportLoading ? 'Processando...' : 'Reenviar Agora'}
            </button>
          </form>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Unlock size={20} />
            Desbloquear Conta (Lockout)
          </h2>
          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1">
                <label className="block text-xs text-gray-400 mb-1">
                  ID Bloqueio
                </label>
                <input
                  type="number"
                  value={lockoutId}
                  onChange={(e) => setLockoutId(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:ring-purple-500 focus:border-purple-500"
                  placeholder="ID"
                  required
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-400 mb-1">
                  Motivo / Nota
                </label>
                <input
                  type="text"
                  value={lockoutNote}
                  onChange={(e) => setLockoutNote(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Solicitado via ticket #..."
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={supportLoading}
              className="w-full py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded font-medium transition-colors disabled:opacity-50"
            >
              {supportLoading ? 'Processando...' : 'Remover Bloqueio'}
            </button>
          </form>
        </div>
      </div>

      {/* Lista de Alertas */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <AlertTriangle size={20} />
            Alertas do Sistema
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterResolved(!filterResolved)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
                filterResolved
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Filter size={14} />
              {filterResolved ? 'Exibindo: Resolvidos' : 'Exibindo: Pendentes'}
            </button>
            <button
              onClick={() => listAlerts({ resolved: filterResolved })}
              className="p-2 bg-gray-700 text-gray-300 rounded hover:text-white hover:bg-gray-600 transition-colors"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {alertsLoading ? (
          <div className="text-center py-8 text-gray-500">
            Carregando alertas...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-gray-900 text-gray-500 uppercase font-medium">
                <tr>
                  <th className="px-4 py-3">Gravidade</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Mensagem</th>
                  <th className="px-4 py-3">Tenant</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {alerts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-8 text-center">
                      Nenhum alerta encontrado.
                    </td>
                  </tr>
                ) : (
                  alerts.map((alert) => (
                    <tr
                      key={alert.id}
                      className="hover:bg-gray-750 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 text-xs font-bold rounded ${
                            alert.severity === 'critical'
                              ? 'bg-red-900 text-red-200'
                              : alert.severity === 'warning'
                                ? 'bg-yellow-900 text-yellow-200'
                                : 'bg-blue-900 text-blue-200'
                          }`}
                        >
                          {alert.severity.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">{alert.category}</td>
                      <td
                        className="px-4 py-3 max-w-xs truncate"
                        title={alert.message}
                      >
                        {alert.message}
                      </td>
                      <td className="px-4 py-3">
                        {alert.tenant ? (
                          <span title={alert.tenant.name}>
                            {alert.tenant.slug}
                          </span>
                        ) : (
                          <span className="text-gray-600">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {new Date(alert.created_at).toLocaleDateString()}{' '}
                        {new Date(alert.created_at).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!alert.resolved_at ? (
                          <button
                            onClick={() => handleResolveAlert(alert.id)}
                            className="text-green-400 hover:text-green-300 text-xs font-medium border border-green-900 bg-green-900/20 px-2 py-1 rounded"
                          >
                            Resolver
                          </button>
                        ) : (
                          <span className="text-gray-600 text-xs flex items-center justify-end gap-1">
                            <CheckCircle size={12} /> Resolvido
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpsSupport;
