import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';

function Modal({
  open,
  onClose,
  title,
  description = null,
  children,
  footer = null,
  size = 'md',
}) {
  const { t } = useTranslation();
  useEffect(() => {
    if (!open || typeof document === 'undefined') {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose?.();
      }
    };

    const body = document.body;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  const sizeClass =
    size === 'lg' ? 'max-w-3xl' : size === 'sm' ? 'max-w-sm' : 'max-w-xl';

  return createPortal(
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-gray-900/40 backdrop-blur-sm"
      style={{
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left))',
        paddingRight: 'max(1rem, env(safe-area-inset-right))',
      }}
      onMouseDown={handleOverlayClick}
      role="presentation"
    >
      <div className="flex min-h-full items-center justify-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          className={`relative my-6 flex max-h-[calc(100dvh-3rem)] w-full transform flex-col overflow-hidden rounded-xl border border-brand-border bg-brand-surface shadow-2xl transition-all ${sizeClass}`}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => onClose?.()}
            className="absolute right-3 top-3 rounded-full bg-brand-light p-1 text-brand-surfaceForeground/60 hover:bg-brand-light/80 hover:text-brand-surfaceForeground focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            aria-label={t('common.close', 'Fechar')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-7">
            {title ? (
              <h2
                id="modal-title"
                className="text-lg font-semibold text-brand-surfaceForeground"
              >
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-2 text-sm text-brand-surfaceForeground/70">
                {description}
              </p>
            ) : null}

            <div className="mt-5">{children}</div>
          </div>

          {footer ? (
            <div className="shrink-0 border-t border-brand-border px-6 py-4">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default Modal;
