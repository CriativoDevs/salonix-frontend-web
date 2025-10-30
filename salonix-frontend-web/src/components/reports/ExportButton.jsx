import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { exportBasicReportsCSV } from '../../api/reports';

const ExportButton = ({ filters, disabled = false }) => {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (disabled || isExporting) return;

    setIsExporting(true);
    try {
      const response = await exportBasicReportsCSV(filters);
      
      // Criar um blob com os dados CSV
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      
      // Criar um link temporário para download
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      // Gerar nome do arquivo com data atual
      const today = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `relatorios-basicos-${today}.csv`);
      
      // Fazer o download
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpar o URL temporário
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      // TODO: Adicionar notificação de erro
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={disabled || isExporting}
      className={`
        px-4 py-2 rounded-lg font-medium transition-colors
        ${disabled || isExporting
          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
          : 'bg-blue-600 text-white hover:bg-blue-700'
        }
      `}
    >
      {isExporting ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {t('reports.export.exporting')}
        </>
      ) : (
        <>
          <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {t('reports.export.csv')}
        </>
      )}
    </button>
  );
};

export default ExportButton;