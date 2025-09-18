export default function ErrorPopup({ error, onClose, title = 'Algo deu errado' }) {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
      role="alertdialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          {code && (
            <p className="mt-1 text-xs uppercase tracking-wide text-gray-400">
              Código: <span className="font-mono text-gray-500">{code}</span>
            </p>
          )}
        </div>

        <p className="text-sm text-gray-700">{message}</p>

        {formattedDetails?.length ? (
          <ul className="mt-3 space-y-1 text-sm text-gray-500">
            {formattedDetails.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-rose-400" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {requestId ? (
          <p className="mt-4 text-xs text-gray-400">
            ID da requisição: <span className="font-mono">{requestId}</span>
          </p>
        ) : null}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-hover focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-1"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
