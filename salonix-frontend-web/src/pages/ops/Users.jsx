import { useState, useEffect, useCallback } from 'react';
import { useOpsUsers } from '../../hooks/useOpsUsers';
import {
  Users,
  Mail,
  UserPlus,
  X,
  Save,
  AlertCircle,
  Edit,
} from 'lucide-react';

const UserModal = ({ isOpen, onClose, onSubmit, user, loading, error }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    ops_role: 'ops_support',
    password: '',
    is_active: true,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        ops_role: user.ops_role,
        is_active: user.is_active,
        password: '', // Password only for creation or reset (not handled here yet)
      });
    } else {
      setFormData({
        username: '',
        email: '',
        ops_role: 'ops_support',
        password: '',
        is_active: true,
      });
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl border border-gray-700 w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">
            {user ? 'Editar Usuário' : 'Novo Usuário'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-200 p-3 rounded flex items-center gap-2 text-sm">
              <AlertCircle size={16} />
              {error.response?.data?.message ||
                error.response?.data?.detail ||
                'Erro ao salvar usuário'}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Nome de Usuário
            </label>
            <input
              type="text"
              required
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-purple-500 focus:outline-none"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-purple-500 focus:outline-none"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          {!user && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Senha Inicial
              </label>
              <input
                type="password"
                required
                minLength={8}
                className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-purple-500 focus:outline-none"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">
              Permissão (Role)
            </label>
            <select
              className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-purple-500 focus:outline-none"
              value={formData.ops_role}
              onChange={(e) =>
                setFormData({ ...formData, ops_role: e.target.value })
              }
            >
              <option value="ops_support">Suporte</option>
              <option value="ops_admin">Admin</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              className="w-4 h-4 rounded bg-gray-900 border-gray-700 text-purple-600 focus:ring-purple-500"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData({ ...formData, is_active: e.target.checked })
              }
            />
            <label htmlFor="is_active" className="text-sm text-gray-300">
              Usuário Ativo
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading ? (
                'Salvando...'
              ) : (
                <>
                  <Save size={18} />
                  Salvar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const OpsUsers = () => {
  const { listUsers, createUser, updateUser, loading, error } = useOpsUsers();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [modalError, setModalError] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await listUsers();
      let allUsers = [];
      if (data && data.results) {
        allUsers = data.results;
      } else if (Array.isArray(data)) {
        allUsers = data;
      }
      setUsers(allUsers);
      setFilteredUsers(allUsers);
    } catch {
      // Error handled by hook
    }
  }, [listUsers]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredUsers(users);
    } else {
      const lower = searchTerm.toLowerCase();
      setFilteredUsers(
        users.filter(
          (u) =>
            u.username.toLowerCase().includes(lower) ||
            u.email.toLowerCase().includes(lower)
        )
      );
    }
  }, [searchTerm, users]);

  const handleCreate = () => {
    setEditingUser(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData) => {
    setModalError(null);
    try {
      if (editingUser) {
        await updateUser(editingUser.id, formData);
      } else {
        await createUser(formData);
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      setModalError(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Usuários Ops</h1>
        <button
          onClick={handleCreate}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded flex items-center gap-2 transition-colors"
        >
          <UserPlus size={18} />
          Novo Usuário
        </button>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Buscar por nome ou email..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-purple-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {error && !isModalOpen && (
        <div className="bg-yellow-900/30 border border-yellow-700 text-yellow-200 p-4 rounded">
          {error.message || 'Erro ao carregar usuários'}
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        {loading && !isModalOpen ? (
          <div className="p-8 text-center text-gray-400">
            Carregando usuários...
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-750 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-700 p-2 rounded-full">
                          <Users size={16} className="text-gray-300" />
                        </div>
                        <div className="font-medium text-white">
                          {user.username}
                        </div>
                      </div>
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
                          user.ops_role === 'ops_admin'
                            ? 'bg-purple-900 text-purple-200'
                            : 'bg-blue-900 text-blue-200'
                        }`}
                      >
                        {user.ops_role === 'ops_admin' ? 'Admin' : 'Suporte'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`flex items-center gap-1 text-xs ${
                          user.is_active ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            user.is_active ? 'bg-green-400' : 'bg-red-400'
                          }`}
                        />
                        {user.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
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
          </div>
        )}
      </div>

      {/* Mobile Cards View */}
      <div className="md:hidden space-y-4">
        {loading && !isModalOpen ? (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center text-gray-400">
            Carregando usuários...
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              className="bg-gray-800 rounded-lg border border-gray-700 p-4 space-y-3"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-700 p-2 rounded-full">
                    <Users size={20} className="text-gray-300" />
                  </div>
                  <div>
                    <div className="font-medium text-white text-base">
                      {user.username}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Mail size={12} />
                      {user.email}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleEdit(user)}
                  className="bg-gray-700 p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-600 transition-colors"
                >
                  <Edit size={18} />
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-gray-700 pt-3">
                <span
                  className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                    user.ops_role === 'ops_admin'
                      ? 'bg-purple-900 text-purple-200'
                      : 'bg-blue-900 text-blue-200'
                  }`}
                >
                  {user.ops_role === 'ops_admin' ? 'Admin' : 'Suporte'}
                </span>
                <span
                  className={`flex items-center gap-1 text-sm ${
                    user.is_active ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      user.is_active ? 'bg-green-400' : 'bg-red-400'
                    }`}
                  />
                  {user.is_active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
          ))
        )}
        {!loading && filteredUsers.length === 0 && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center text-gray-400">
            Nenhum usuário encontrado.
          </div>
        )}
      </div>

      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        user={editingUser}
        loading={loading}
        error={modalError}
      />
    </div>
  );
};

export default OpsUsers;
