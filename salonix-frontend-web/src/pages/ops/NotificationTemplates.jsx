import React, { useEffect, useState, useCallback } from 'react';
import { useOpsNotificationTemplates } from '../../hooks/useOpsNotificationTemplates';
import { Search, Plus, Edit2, Trash2, X, Save, Code } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import FormInput from '../../components/ui/FormInput';
import FormButton from '../../components/ui/FormButton';
import TableLoadingSpinner from '../../components/ui/TableLoadingSpinner';
import { toast } from 'react-toastify';

const NotificationTemplates = () => {
  const {
    listTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    loading,
  } = useOpsNotificationTemplates();
  const [templates, setTemplates] = useState([]);
  const [search, setSearch] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    channel: 'email',
    subject: '',
    body_text: '',
    body_html: '',
  });

  const [activeBodyTab, setActiveBodyTab] = useState('text'); // 'text' or 'html'

  const fetchTemplates = useCallback(async () => {
    try {
      const params = {};
      if (search) params.search = search;

      const data = await listTemplates(params);
      const results = data.results || (Array.isArray(data) ? data : []);
      setTemplates(results);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar templates');
    }
  }, [search, listTemplates]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchTemplates();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [fetchTemplates]);

  const handleOpenModal = (template = null) => {
    if (template) {
      setCurrentTemplate(template);
      setFormData({
        code: template.code,
        channel: template.channel,
        subject: template.subject,
        body_text: template.body_text,
        body_html: template.body_html || '',
      });
    } else {
      setCurrentTemplate(null);
      setFormData({
        code: '',
        channel: 'email',
        subject: '',
        body_text: '',
        body_html: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleDeleteClick = (template) => {
    setCurrentTemplate(template);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentTemplate) {
        await updateTemplate(currentTemplate.id, formData);
        toast.success('Template atualizado com sucesso');
      } else {
        await createTemplate(formData);
        toast.success('Template criado com sucesso');
      }
      setIsModalOpen(false);
      fetchTemplates();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar template');
    }
  };

  const handleConfirmDelete = async () => {
    if (!currentTemplate) return;
    try {
      await deleteTemplate(currentTemplate.id);
      toast.success('Template removido com sucesso');
      setIsDeleteModalOpen(false);
      fetchTemplates();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao remover template');
    }
  };

  const TEMPLATE_CODES = [
    { value: 'PWA_INVITE', label: 'Convite PWA (Email)' },
    { value: 'APPOINTMENT_CONFIRMATION', label: 'Confirmação de Agendamento' },
    { value: 'APPOINTMENT_CANCELLATION', label: 'Cancelamento de Agendamento' },
    { value: 'ACCOUNT_ACTIVATION', label: 'Ativação de Conta' },
    { value: 'PASSWORD_RESET', label: 'Redefinição de Senha' },
    { value: 'WELCOME', label: 'Boas-vindas' },
    { value: 'SUBSCRIPTION_UPDATED', label: 'Assinatura Atualizada' },
    { value: 'PAYMENT_FAILED', label: 'Falha no Pagamento' },
  ];

  const CHANNELS = [
    { value: 'email', label: 'E-mail' },
    { value: 'sms', label: 'SMS' },
    { value: 'push', label: 'Push Notification' },
    { value: 'whatsapp', label: 'WhatsApp' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">
          Templates de Notificação
        </h2>
        <button
          onClick={() => handleOpenModal()}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Novo Template
        </button>
      </div>

      {/* Search */}
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por código..."
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
                <th className="px-6 py-3">Código</th>
                <th className="px-6 py-3">Canal</th>
                <th className="px-6 py-3">Assunto</th>
                <th className="px-6 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {loading && templates.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8">
                    <TableLoadingSpinner />
                  </td>
                </tr>
              ) : templates.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Nenhum template encontrado.
                  </td>
                </tr>
              ) : (
                templates.map((template) => (
                  <tr
                    key={template.id}
                    className="hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-white">
                      {template.code}
                      {TEMPLATE_CODES.find(
                        (t) => t.value === template.code
                      ) && (
                        <span className="block text-xs text-gray-500 mt-1">
                          {
                            TEMPLATE_CODES.find(
                              (t) => t.value === template.code
                            ).label
                          }
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      <span
                        className={`px-2 py-1 rounded text-xs border ${
                          template.channel === 'email'
                            ? 'border-blue-500/30 text-blue-400'
                            : template.channel === 'whatsapp'
                              ? 'border-green-500/30 text-green-400'
                              : 'border-gray-500/30 text-gray-400'
                        }`}
                      >
                        {CHANNELS.find((c) => c.value === template.channel)
                          ?.label || template.channel}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm truncate max-w-xs">
                      {template.subject}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(template)}
                          className="p-1 hover:bg-gray-600 rounded text-blue-400 transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(template)}
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
        title={currentTemplate ? 'Editar Template' : 'Novo Template'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Código"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
              placeholder="Ex: PWA_INVITE"
              required
              list="template-codes"
            />
            <datalist id="template-codes">
              {TEMPLATE_CODES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </datalist>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-300">
                Canal
              </label>
              <select
                value={formData.channel}
                onChange={(e) =>
                  setFormData({ ...formData, channel: e.target.value })
                }
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
              >
                {CHANNELS.map((channel) => (
                  <option key={channel.value} value={channel.value}>
                    {channel.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <FormInput
            label="Assunto"
            value={formData.subject}
            onChange={(e) =>
              setFormData({ ...formData, subject: e.target.value })
            }
            placeholder="Ex: Bem-vindo ao TimelyOne, {{ tenant_name }}!"
            required={
              formData.channel === 'email' || formData.channel === 'push'
            }
          />

          <div className="space-y-2">
            <div className="flex border-b border-gray-700">
              <button
                type="button"
                onClick={() => setActiveBodyTab('text')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeBodyTab === 'text'
                    ? 'text-purple-400 border-b-2 border-purple-400'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Texto Puro
              </button>
              <button
                type="button"
                onClick={() => setActiveBodyTab('html')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  activeBodyTab === 'html'
                    ? 'text-purple-400 border-b-2 border-purple-400'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                HTML
              </button>
            </div>

            {activeBodyTab === 'text' && (
              <div className="space-y-1">
                <textarea
                  value={formData.body_text}
                  onChange={(e) =>
                    setFormData({ ...formData, body_text: e.target.value })
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all min-h-[200px] font-mono text-sm"
                  placeholder="Conteúdo em texto puro..."
                  required
                />
              </div>
            )}

            {activeBodyTab === 'html' && (
              <div className="space-y-1">
                <textarea
                  value={formData.body_html}
                  onChange={(e) =>
                    setFormData({ ...formData, body_html: e.target.value })
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all min-h-[200px] font-mono text-sm"
                  placeholder="Conteúdo HTML (opcional)..."
                />
              </div>
            )}
            <p className="text-xs text-gray-500">
              Use chaves duplas para variáveis, ex: {'{{ link }}'}.
            </p>
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
              {currentTemplate ? 'Salvar Alterações' : 'Criar Template'}
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
            Tem certeza que deseja excluir o template{' '}
            <strong>{currentTemplate?.code}</strong>? Esta ação não pode ser
            desfeita.
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

export default NotificationTemplates;
