import { useState, useCallback } from 'react';

const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', options = {}) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      type,
      isVisible: true,
      duration: options.duration || 4000,
      position: options.position || 'top-right',
      ...options
    };

    setToasts(prev => [...prev, toast]);

    // Auto remove toast after duration
    if (toast.duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, toast.duration);
    }

    return id;
  }, []);

  const hideToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const hideAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const showSuccess = useCallback((message, options = {}) => {
    return showToast(message, 'success', options);
  }, [showToast]);

  const showError = useCallback((message, options = {}) => {
    return showToast(message, 'error', options);
  }, [showToast]);

  const showWarning = useCallback((message, options = {}) => {
    return showToast(message, 'warning', options);
  }, [showToast]);

  const showInfo = useCallback((message, options = {}) => {
    return showToast(message, 'info', options);
  }, [showToast]);

  return {
    toasts,
    showToast,
    hideToast,
    hideAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

export default useToast;