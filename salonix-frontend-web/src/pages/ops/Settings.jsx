import { Link } from 'react-router-dom';
import { Settings as SettingsIcon, FileText, Bell, Globe } from 'lucide-react';

const Settings = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <SettingsIcon className="text-purple-500" />
          Configurações do Sistema
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card for Audit Logs */}
        <Link 
          to="/ops/settings/audit" 
          className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-purple-500 transition-colors group"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gray-900 rounded-lg group-hover:bg-purple-900/30 transition-colors">
              <FileText className="text-purple-400" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Logs de Auditoria</h3>
              <p className="text-sm text-gray-400">Visualize as ações do sistema</p>
            </div>
          </div>
        </Link>

        {/* Global Vars */}
        <Link
          to="/ops/settings/global"
          className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-purple-500 transition-colors group"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gray-900 rounded-lg group-hover:bg-purple-900/30 transition-colors">
              <Globe className="text-purple-400" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Variáveis Globais</h3>
              <p className="text-sm text-gray-400">Gerencie configurações do sistema</p>
            </div>
          </div>
        </Link>

        {/* Notifications */}
        <Link
          to="/ops/settings/notifications"
          className="bg-gray-800 p-6 rounded-lg border border-gray-700 hover:border-purple-500 transition-colors group"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gray-900 rounded-lg group-hover:bg-purple-900/30 transition-colors">
              <Bell className="text-purple-400" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Notificações</h3>
              <p className="text-sm text-gray-400">Templates de e-mail e mensagens</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default Settings;
