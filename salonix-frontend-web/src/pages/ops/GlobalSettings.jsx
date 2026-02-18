import React, { useEffect, useState, useCallback } from 'react';
import { useOpsGlobalSettings } from '../../hooks/useOpsGlobalSettings';
import { Search, Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import FormInput from '../../components/ui/FormInput';
import FormButton from '../../components/ui/FormButton';
import TableLoadingSpinner from '../../components/ui/TableLoadingSpinner';
import { toast } from 'react-toastify';

const GlobalSettings = () => {
  const { listSettings, createSetting, updateSetting, deleteSetting, loading } = useOpsGlobalSettings();
  const [settings, setSettings] = useState([]);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentSetting, setCurrentSetting] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    value_type: 'string',
    description: '',
    is_public: false
  });

  const fetchSettings = useCallback(async () => {
    try {
      const params = {};
      if (search) params.search = search;
      
      const data = await listSettings(params);
      // Assuming non-paginated or simple list for now, or handle pagination if needed
      // If DRF default pagination is on, data.results contains the list
      const results = data.results || (Array.isArray(data) ? data : []);
      setSettings(results);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar configurações');
    }
  }, [search, listSettings]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSettings();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [fetchSettings]);

  const handleOpenModal = (setting = null) => {
    if (setting) {
      setCurrentSetting(setting);
      setFormData({
        key: setting.key,
        value: setting.value,
        value_type: setting.value_type,
        description: setting.description || '',
        is_public: setting.is_public
      });
    } else {
      setCurrentSetting(null);
      setFormData({
        key: '',
        value: '',
        value_type: 'string',
        description: '',
        is_public: false
      });
    }
    setIsModalOpen(true);
  };

  const handleDeleteClick = (setting) => {
    setCurrentSetting(setting);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentSetting) {
        await updateSetting(currentSetting.key, formData);
        toast.success('Configuração atualizada com sucesso');
      } else {
        await createSetting(formData);
        toast.success('Configuração criada com sucesso');
      }
      setIsModalOpen(false);
      fetchSettings();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar configuração');
    }
  };

  const handleConfirmDelete = async () => {
    if (!currentSetting) return;
    try {
      await deleteSetting(currentSetting.key);
      toast.success('Configuração removida com sucesso');
      setIsDeleteModalOpen(false);
      fetchSettings();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao remover configuração');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Variáveis Globais</h2>
        <button
          onClick={() => handleOpenModal()}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Nova Variável
        </button>
      </div>

      {/* Search */}
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por chave..."
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-900 text-gray-400 uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Chave</th>
                <th className="px-6 py-3">Valor</th>
                <th className="px-6 py-3">Tipo</th>
                <th className="px-6 py-3">Público</th>
                <th className="px-6 py-3">Descrição</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading && settings.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8">
                    <TableLoadingSpinner />
                  </td>
                </tr>
              ) : settings.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    Nenhuma configuração encontrada.
                  </td>
                </tr>
              ) : (
                settings.map((setting) => (
                  <tr key={setting.key} className="hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{setting.key}</td>
                    <td className="px-6 py-4 text-gray-300 max-w-xs truncate" title={setting.value}>
                      {setting.value}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      <span className="px-2 py-1 bg-gray-700 rounded text-xs">
                        {setting.value_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {setting.is_public ? (
                        <span className="text-green-400 text-xs border border-green-400/30 px-2 py-1 rounded">Sim</span>
                      ) : (
                        <span className="text-gray-500 text-xs border border-gray-500/30 px-2 py-1 rounded">Não</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm truncate max-w-xs">
                      {setting.description || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(setting)}
                          className="p-1 hover:bg-gray-600 rounded text-blue-400 transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(setting)}
                          className="p-1 hover:bg-gray-600 rounded text-red-400 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit/Create Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentSetting ? "Editar Variável" : "Nova Variável"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Chave"
            value={formData.key}
            onChange={(e) => setFormData({ ...formData, key: e.target.value })}
            placeholder="Ex: SITE_TITLE"
            disabled={!!currentSetting} // Key is immutable after creation usually, or handle carefully
            required
          />
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-300">Tipo de Valor</label>
            <select
              value={formData.value_type}
              onChange={(e) => setFormData({ ...formData, value_type: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
            >
              <option value="string">Texto</option>
              <option value="boolean">Booleano</option>
              <option value="integer">Inteiro</option>
              <option value="json">JSON</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-300">Valor</label>
            <textarea
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all min-h-[100px]"
              placeholder="Valor da configuração..."
              required
            />
          </div>

          <FormInput
            label="Descrição"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descrição opcional..."
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_public"
              checked={formData.is_public}
              onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
              className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
            />
            <label htmlFor="is_public" className="text-sm text-gray-300">
              Público (visível para todos os tenants)
            </label>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <FormButton type="submit" loading={loading}>
              {currentSetting ? 'Salvar Alterações' : 'Criar Variável'}
            </FormButton>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Exclusão"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Tem certeza que deseja excluir a variável <strong>{currentSetting?.key}</strong>?
            Esta ação não pode ser desfeita.
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Excluir
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GlobalSettings;
