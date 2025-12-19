import React from 'react';

const OpsDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-gray-400 text-sm font-medium">Total Tenants</h3>
          <p className="text-3xl font-bold text-white mt-2">124</p>
          <div className="mt-2 text-green-400 text-sm flex items-center">
            <span>+12% este mês</span>
          </div>
        </div>
        
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-gray-400 text-sm font-medium">Receita Recorrente</h3>
          <p className="text-3xl font-bold text-white mt-2">€ 4.2k</p>
          <div className="mt-2 text-green-400 text-sm flex items-center">
            <span>+5% este mês</span>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-gray-400 text-sm font-medium">Alertas Ativos</h3>
          <p className="text-3xl font-bold text-white mt-2">3</p>
          <div className="mt-2 text-yellow-400 text-sm flex items-center">
            <span>Atenção necessária</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Atividade Recente</h2>
        <div className="text-gray-400 text-sm text-center py-8">
          Nenhuma atividade recente registrada.
        </div>
      </div>
    </div>
  );
};

export default OpsDashboard;
