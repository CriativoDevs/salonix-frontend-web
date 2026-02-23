import { useTranslation } from 'react-i18next';

export default function ErrorPopup({ error, onClose, title }) {
  const { t } = useTranslation();
  if (!error) return null;

  const { message, code, requestId, details } = error;

  const formattedDetails = (() => {
    if (!details) return null;
    if (Array.isArray(details)) return details;
    if (typeof details === 'string') return [details];
    return Object.entries(details).map(([field, msgs]) => {
      const value = Array.isArray(msgs) ? msgs.join(', ') : String(msgs);
      return `${field}: ${value}`;
    });
  })();

  const resolvedTitle = title || t('common.error_generic', 'Algo deu errado');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 px-4 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-xl border border-brand-border bg-brand-surface p-6 shadow-2xl">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-brand-surfaceForeground">
            {resolvedTitle}
          </h2>
          {code && (
            <p className="mt-1 text-xs uppercase tracking-wide text-brand-surfaceForeground/60">
              {t('common.code', 'Código')}:{' '}
              <span className="font-mono text-brand-surfaceForeground/80">
                {code}
              </span>
            </p>
          )}
        </div>

        <p className="text-sm text-brand-surfaceForeground">{message}</p>

        {formattedDetails?.length ? (
          <ul className="mt-3 space-y-1 text-sm text-brand-surfaceForeground/80">
            {formattedDetails.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span
                  className="mt-1 h-1.5 w-1.5 rounded-full bg-rose-400"
                  aria-hidden
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {requestId ? (
          <p className="mt-4 text-xs text-brand-surfaceForeground/60">
            {t('common.request_id', 'ID da requisição')}:{' '}
            <span className="font-mono">{requestId}</span>
          </p>
        ) : null}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-brand-primary underline underline-offset-4 hover:text-brand-primary/80 focus:outline-none"
          >
            {t('common.close', 'Fechar')}
          </button>
        </div>
      </div>
    </div>
  );
}
