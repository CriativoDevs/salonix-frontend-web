import React, { useState, useEffect } from 'react';
import { useOpsAuth } from '../../hooks/useOpsAuth';
import { Users, Shield, Mail, UserPlus } from 'lucide-react';

const OpsUsers = () => {
  const { api } = useOpsAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        // Assuming endpoint exists, if not it will be caught
        const response = await api.get('/users/');
        if (mounted) {
          setUsers(response.data);
          setError(null); // Ensure error is cleared on success
        }
      } catch (err) {
        if (!mounted) return;

        // Check for auth error first to avoid noise
        if (
          err.response?.status === 401 ||
          err.response?.data?.code === 'E001'
        ) {
          // Auth error, context will handle redirect
          return;
        }

        console.error('Error fetching ops users:', err);

        // Fallback or specific error handling
        if (err.response && err.response.status === 404) {
          // Mock data if endpoint not ready yet, to show UI
          setUsers([
            {
              id: 1,
              username: 'admin',
              email: 'admin@salonix.com',
              ops_role: 'admin',
              is_active: true,
            },
            {
              id: 2,
              username: 'suporte',
              email: 'suporte@salonix.com',
              ops_role: 'support',
              is_active: true,
            },
          ]);
          setError(
            `Endpoint /ops/users/ retornou 404. Exibindo dados simulados.`
          );
        } else {
          setError(
            `Falha ao carregar usuários do Ops: ${
              err.response?.data?.detail || err.message
            }`
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchUsers();

    return () => {
      mounted = false;
    };
  }, [api]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Usuários Ops</h1>
        <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors">
          <UserPlus size={18} />
          Novo Usuário
        </button>
      </div>

      {error && (
        <div className="bg-yellow-900/30 border border-yellow-700 text-yellow-200 p-4 rounded">
          {error}
        </div>
      )}

      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">
            Carregando usuários...
          </div>
        ) : (
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-gray-900 text-gray-500 uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Usuário</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-gray-750 transition-colors"
                >
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="bg-gray-700 p-2 rounded-full">
                      <Users size={16} className="text-gray-300" />
                    </div>
                    <span className="font-medium text-white">
                      {user.username}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Mail size={14} />
                      {user.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                        user.ops_role === 'admin'
                          ? 'bg-purple-900 text-purple-200'
                          : 'bg-blue-900 text-blue-200'
                      }`}
                    >
                      {user.ops_role || 'Staff'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`flex items-center gap-1 text-xs ${user.is_active ? 'text-green-400' : 'text-red-400'}`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-green-400' : 'bg-red-400'}`}
                      />
                      {user.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-gray-400 hover:text-white transition-colors">
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default OpsUsers;
