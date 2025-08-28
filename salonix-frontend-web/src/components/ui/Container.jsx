import React from 'react';

/**
 * ÚNICA régua de largura do app.
 * Troque o max-w abaixo para 3xl/4xl/5xl se quiser ajustar a largura geral.
 */
const WIDTH = 'max-w-4xl';

export default function Container({ className = '', children }) {
  return (
    <div className="w-full flex justify-center">
      <div className={`w-full ${WIDTH} px-4 sm:px-6 lg:px-8 ${className}`}>
        {children}
      </div>
    </div>
  );
}
