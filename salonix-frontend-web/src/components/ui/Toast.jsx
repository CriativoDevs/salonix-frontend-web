import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const Toast = ({ 
  type = 'info', 
  message, 
  isVisible, 
  onClose, 
  duration = 4000,
  position = 'top-right' 
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-center':
        return 'top-4 left-1/2 transform -translate-x-1/2';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-center':
        return 'bottom-4 left-1/2 transform -translate-x-1/2';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--success)',
          borderColor: 'var(--success)'
        };
      case 'error':
        return {
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--error)',
          borderColor: 'var(--error)'
        };
      case 'warning':
        return {
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--warning)',
          borderColor: 'var(--warning)'
        };
      default:
        return {
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--info)',
          borderColor: 'var(--info)'
        };
    }
  };

  return (
    <div 
      className={`fixed z-50 ${getPositionClasses()} animate-in slide-in-from-top-2 duration-300`}
    >
      <div 
        className="flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg min-w-[300px] max-w-[500px]"
        style={getTypeStyles()}
      >
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 rounded-md hover:opacity-70 transition-opacity"
          aria-label="Fechar notificação"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;