import { useState, useEffect, useCallback, Fragment } from 'react';
import { useOpsAuditLogs } from '../../hooks/useOpsAuditLogs';
import { useOpsUsers } from '../../hooks/useOpsUsers';
import {
  FileText,
  Filter,
  Search,
  Calendar,
  User,
  Activity,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const AuditLogs = () => {
  const { listAuditLogs, loading, error } = useOpsAuditLogs();
  const { listUsers } = useOpsUsers();

  const [logs, setLogs] = useState([]);
  const [opsUsers, setOpsUsers] = useState([]);
  const [filters, setFilters] = useState({
    actor_id: '',
    action: '',
    date_from: '',
    date_to: '',
  });
  const [expandedLogId, setExpandedLogId] = useState(null);

  const fetchLogs = useCallback(async () => {
    try {
      // Remove empty filters
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '')
      );
      const data = await listAuditLogs(activeFilters);
      let results = [];
      if (data && data.results) {
        results = data.results;
      } else if (Array.isArray(data)) {
        results = data;
      }
      setLogs(results);
    } catch {
      // Error handled by hook
    }
  }, [listAuditLogs, filters]);

  const fetchOpsUsers = useCallback(async () => {
    try {
      const data = await listUsers();
      let results = [];
      if (data && data.results) {
        results = data.results;
      } else if (Array.isArray(data)) {
        results = data;
      }
      setOpsUsers(results);
    } catch (err) {
      console.error('Failed to load ops users for filter', err);
    }
  }, [listUsers]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    fetchOpsUsers();
  }, [fetchOpsUsers]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleExpand = (id) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FileText className="text-purple-500" />
          Logs de Auditoria
        </h1>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-1">
            <User size={12} /> Usuário (Ator)
          </label>
          <select
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-sm focus:border-purple-500 focus:outline-none"
            value={filters.actor_id}
            onChange={(e) => handleFilterChange('actor_id', e.target.value)}
          >
            <option value="">Todos</option>
            {opsUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.username} ({user.email})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-1">
            <Activity size={12} /> Ação
          </label>
          <input
            type="text"
            placeholder="Ex: tenant_update"
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-sm focus:border-purple-500 focus:outline-none"
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-1">
            <Calendar size={12} /> Data Início
          </label>
          <input
            type="date"
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-sm focus:border-purple-500 focus:outline-none"
            value={filters.date_from}
            onChange={(e) => handleFilterChange('date_from', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1 flex items-center gap-1">
            <Calendar size={12} /> Data Fim
          </label>
          <input
            type="date"
            className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white text-sm focus:border-purple-500 focus:outline-none"
            value={filters.date_to}
            onChange={(e) => handleFilterChange('date_to', e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-200 p-4 rounded">
          {error.message || 'Erro ao carregar logs'}
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">
            Carregando logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            Nenhum registro encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-gray-900 text-gray-500 uppercase font-medium">
                <tr>
                  <th className="px-6 py-4">Data/Hora</th>
                  <th className="px-6 py-4">Ator</th>
                  <th className="px-6 py-4">Ação</th>
                  <th className="px-6 py-4">Alvo (User/Tenant)</th>
                  <th className="px-6 py-4">Resultado</th>
                  <th className="px-6 py-4 text-right">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {logs.map((log) => (
                  <Fragment key={log.id}>
                    <tr
                      className="hover:bg-gray-750 transition-colors cursor-pointer"
                      onClick={() => toggleExpand(log.id)}
                    >
                      <td className="px-6 py-4 font-mono text-xs text-gray-300">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white font-medium">
                          {log.actor_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {log.actor_email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-gray-700 text-white px-2 py-1 rounded text-xs font-mono">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {log.target_user_email && (
                          <div className="flex items-center gap-1 text-xs">
                            <User size={10} className="text-blue-400" />
                            {log.target_user_email}
                          </div>
                        )}
                        {log.target_tenant_name && (
                          <div className="flex items-center gap-1 text-xs mt-1">
                            <Activity size={10} className="text-green-400" />
                            {log.target_tenant_name}
                          </div>
                        )}
                        {!log.target_user_email && !log.target_tenant_name && (
                          <span className="text-gray-600">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            log.result?.status === 'success'
                              ? 'bg-green-900/30 text-green-300 border border-green-800'
                              : 'bg-red-900/30 text-red-300 border border-red-800'
                          }`}
                        >
                          {log.result?.status || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-gray-400 hover:text-white">
                          {expandedLogId === log.id ? (
                            <ChevronUp size={18} />
                          ) : (
                            <ChevronDown size={18} />
                          )}
                        </button>
                      </td>
                    </tr>
                    {expandedLogId === log.id && (
                      <tr className="bg-gray-900/50">
                        <td colSpan="6" className="px-6 py-4">
                          <div className="bg-black/30 p-4 rounded border border-gray-800 font-mono text-xs text-green-400 overflow-x-auto">
                            <pre>{JSON.stringify(log.payload, null, 2)}</pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="text-center text-gray-400 py-8">
            Carregando logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            Nenhum registro encontrado.
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="bg-gray-800 rounded-lg p-4 border border-gray-700 space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-white font-medium">{log.action}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {formatDate(log.created_at)}
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    log.result?.status === 'success'
                      ? 'bg-green-900/30 text-green-300 border border-green-800'
                      : 'bg-red-900/30 text-red-300 border border-red-800'
                  }`}
                >
                  {log.result?.status || 'N/A'}
                </span>
              </div>

              <div className="text-sm text-gray-300">
                <span className="text-gray-500 text-xs uppercase block mb-1">
                  Ator
                </span>
                {log.actor_name} ({log.actor_email})
              </div>

              {(log.target_user_email || log.target_tenant_name) && (
                <div className="text-sm text-gray-300">
                  <span className="text-gray-500 text-xs uppercase block mb-1">
                    Alvo
                  </span>
                  {log.target_user_email && (
                    <div>User: {log.target_user_email}</div>
                  )}
                  {log.target_tenant_name && (
                    <div>Tenant: {log.target_tenant_name}</div>
                  )}
                </div>
              )}

              <button
                onClick={() => toggleExpand(log.id)}
                className="w-full mt-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs py-2 rounded transition-colors flex justify-center items-center gap-1"
              >
                {expandedLogId === log.id ? (
                  <>
                    Ocultar Detalhes <ChevronUp size={14} />
                  </>
                ) : (
                  <>
                    Ver Payload <ChevronDown size={14} />
                  </>
                )}
              </button>

              {expandedLogId === log.id && (
                <div className="bg-black/30 p-3 rounded border border-gray-800 font-mono text-xs text-green-400 overflow-x-auto mt-2">
                  <pre>{JSON.stringify(log.payload, null, 2)}</pre>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
