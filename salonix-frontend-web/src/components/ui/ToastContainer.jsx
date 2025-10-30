import React from 'react';
import Toast from './Toast';

const ToastContainer = ({ toasts, onClose }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          message={toast.message}
          isVisible={toast.isVisible}
          onClose={() => onClose(toast.id)}
          duration={0} // Duration is handled by useToast hook
          position={toast.position}
        />
      ))}
    </>
  );
};

export default ToastContainer;