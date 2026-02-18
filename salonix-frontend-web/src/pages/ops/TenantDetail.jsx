import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOpsTenants } from '../../hooks/useOpsTenants';
import { ArrowLeft, User, Activity, Settings } from 'lucide-react';

const TenantDetail = () => {
  const { id } = useParams();
  const {
    getTenant,
    resetOwnerPassword,
    updatePlan,
    blockTenant,
    unblockTenant,
    loading,
  } = useOpsTenants();
  const [tenant, setTenant] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  // Action States
  const [showResetModal, setShowResetModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [newPlan, setNewPlan] = useState('basic');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  const load = useCallback(async () => {
    setFetchError(null);
    try {
      const data = await getTenant(id);
      setTenant(data);
      setNewPlan(data.plan_tier); // Initialize with current plan
    } catch (err) {
      console.error(err);
      setFetchError('Não foi possível carregar os detalhes do tenant.');
    }
  }, [id, getTenant]);

  useEffect(() => {
    load();
  }, [load]);

  const handleResetPassword = async () => {
    setActionLoading(true);
    try {
      const result = await resetOwnerPassword(id);
      setActionSuccess(result.temp_password); // Assume backend returns { temp_password: "..." }
    } catch (err) {
      console.error(err);
      alert('Erro ao resetar senha.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePlan = async () => {
    setActionLoading(true);
    try {
      await updatePlan(id, newPlan);
      await load(); // Refresh data
      setShowPlanModal(false);
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar plano.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleBlock = async () => {
    setActionLoading(true);
    try {
      if (tenant.is_active) {
        await blockTenant(id);
      } else {
        await unblockTenant(id);
      }
      await load();
      setShowBlockModal(false);
    } catch (err) {
      console.error(err);
      alert('Erro ao alterar status do tenant.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !tenant)
    return <div className="text-white p-6">Carregando...</div>;

  if (fetchError && !tenant) {
    return (
      <div className="text-white p-6">
        <p className="text-red-400 mb-4">{fetchError}</p>
        <button
          onClick={load}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!tenant)
    return <div className="text-white p-6">Tenant não encontrado.</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link to="/ops/tenants" className="text-gray-400 hover:text-white">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-white">{tenant.name}</h2>
          <p className="text-gray-400 text-sm">ID: {tenant.id}</p>
        </div>
        <div className="ml-auto">
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold 
            ${tenant.is_active ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'}`}
          >
            {tenant.is_active ? 'Ativo' : 'Inativo'}
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info Card */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-4">
          <h3 className="text-lg font-medium text-white flex items-center">
            <Settings className="h-5 w-5 mr-2 text-purple-400" />
            Detalhes Gerais
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Slug</span>
              <span className="text-white">{tenant.slug}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Plano</span>
              <span className="text-white uppercase">{tenant.plan_tier}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Criado em</span>
              <span className="text-white">
                {new Date(tenant.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Owner Card */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-4">
          <h3 className="text-lg font-medium text-white flex items-center">
            <User className="h-5 w-5 mr-2 text-blue-400" />
            Proprietário
          </h3>
          {tenant.owner ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Nome</span>
                <span className="text-white">{tenant.owner.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Email</span>
                <span className="text-white">{tenant.owner.email}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Sem proprietário definido.</p>
          )}
        </div>

        {/* Stats/Usage Card */}
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-4">
          <h3 className="text-lg font-medium text-white flex items-center">
            <Activity className="h-5 w-5 mr-2 text-green-400" />
            Uso e Métricas
          </h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-gray-400 text-xs uppercase font-semibold mb-2">
                Usuários
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-gray-700 p-2 rounded">
                  <span className="block text-gray-400 text-xs">Total</span>
                  <span className="text-white font-medium">
                    {tenant.user_counts?.total || 0}
                  </span>
                </div>
                <div className="bg-gray-700 p-2 rounded">
                  <span className="block text-gray-400 text-xs">Ativos</span>
                  <span className="text-white font-medium">
                    {tenant.user_counts?.active || 0}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-gray-400 text-xs uppercase font-semibold mb-2">
                Notificações (Mês)
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total</span>
                  <span className="text-white">
                    {tenant.notification_consumption?.total || 0}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>SMS</span>
                  <span>{tenant.notification_consumption?.sms || 0}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>WhatsApp</span>
                  <span>{tenant.notification_consumption?.whatsapp || 0}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Email</span>
                  <span>{tenant.notification_consumption?.email || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions (Future) */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h3 className="text-lg font-medium text-white mb-4">
          Ações Administrativas
        </h3>
        <div className="flex space-x-4">
          <button
            onClick={() => {
              setShowResetModal(true);
              setActionSuccess(null);
            }}
            className="px-4 py-2 bg-red-900 hover:bg-red-800 text-red-100 rounded-md text-sm transition-colors"
          >
            Resetar Senha do Owner
          </button>
          <button
            onClick={() => setShowPlanModal(true)}
            className="px-4 py-2 bg-purple-900 hover:bg-purple-800 text-purple-100 rounded-md text-sm transition-colors"
          >
            Alterar Plano
          </button>
          <button
            onClick={() => setShowBlockModal(true)}
            className={`px-4 py-2 rounded-md text-sm transition-colors ${
              tenant.is_active
                ? 'bg-yellow-900 hover:bg-yellow-800 text-yellow-100'
                : 'bg-green-900 hover:bg-green-800 text-green-100'
            }`}
          >
            {tenant.is_active ? 'Suspender Acesso' : 'Reativar Acesso'}
          </button>
        </div>
      </div>

      {/* Modals */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-4">
              Resetar Senha do Owner
            </h3>
            <p className="text-gray-300 mb-6">
              Tem certeza que deseja resetar a senha do proprietário? Uma nova
              senha temporária será gerada e exibida aqui.
            </p>
            {actionSuccess ? (
              <div className="bg-green-900 text-green-200 p-4 rounded mb-6 break-all border border-green-700">
                <p className="text-xs text-green-300 mb-1">
                  Nova senha temporária:
                </p>
                <span className="font-mono font-bold text-lg select-all">
                  {actionSuccess}
                </span>
              </div>
            ) : null}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setActionSuccess(null);
                }}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Fechar
              </button>
              {!actionSuccess && (
                <button
                  onClick={handleResetPassword}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Processando...' : 'Confirmar Reset'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showPlanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-4">Alterar Plano</h3>
            <div className="mb-4 bg-yellow-900/50 border border-yellow-700 p-3 rounded">
              <p className="text-sm text-yellow-200">
                ⚠️ <strong>Atenção:</strong> Esta alteração é apenas
                administrativa e não afeta cobranças automáticas em gateways
                externos.
              </p>
            </div>
            <div className="mb-6">
              <label className="block text-gray-400 text-sm mb-2">
                Novo Plano
              </label>
              <select
                value={newPlan}
                onChange={(e) => setNewPlan(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="basic">Basic</option>
                <option value="standard">Standard</option>
                <option value="pro">Pro</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowPlanModal(false)}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdatePlan}
                disabled={actionLoading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBlockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700 shadow-xl">
            <h3 className="text-xl font-bold text-white mb-4">
              {tenant.is_active ? 'Suspender Acesso' : 'Reativar Acesso'}
            </h3>
            <p className="text-gray-300 mb-6">
              {tenant.is_active
                ? 'Tem certeza que deseja suspender este tenant? Nenhum usuário conseguirá fazer login.'
                : 'Tem certeza que deseja reativar este tenant? O acesso será restaurado imediatamente.'}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowBlockModal(false)}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleToggleBlock}
                disabled={actionLoading}
                className={`px-4 py-2 rounded transition-colors disabled:opacity-50 ${
                  tenant.is_active
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {actionLoading ? 'Processando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantDetail;
