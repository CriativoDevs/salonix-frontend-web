// Campo de ficha (anamnese) reutilizado no lado do tenant e do cliente.
const inputClass =
  'mt-1 w-full rounded-lg border border-brand-border bg-brand-surface px-3 py-2 text-sm text-brand-surfaceForeground';

export default function FormFieldInput({ field, value, onChange, t }) {
  const id = `ff-${field.id}`;
  const label = (
    <>
      {field.label}
      {field.required ? (
        <>
          <span aria-hidden="true" className="text-rose-600">
            {' '}
            *
          </span>
          <span className="sr-only">
            {' '}
            ({t('forms.fill.required_sr', 'obrigatório')})
          </span>
        </>
      ) : null}
    </>
  );

  if (field.field_type === 'boolean') {
    return (
      <label
        htmlFor={id}
        className="flex items-center gap-3 rounded-lg border border-brand-border bg-brand-surface px-3 py-2.5 text-sm font-medium text-brand-surfaceForeground/80"
      >
        <input
          id={id}
          type="checkbox"
          className="h-4 w-4 shrink-0"
          checked={value === 'true'}
          onChange={(event) => onChange(event.target.checked ? 'true' : 'false')}
        />
        {label}
      </label>
    );
  }

  let control;
  if (field.field_type === 'textarea') {
    control = (
      <textarea
        id={id}
        rows={3}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
    );
  } else if (field.field_type === 'select') {
    control = (
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      >
        <option value="">{t('forms.fill.select_placeholder', 'Selecione...')}</option>
        {(field.options || []).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  } else {
    const type =
      field.field_type === 'number'
        ? 'number'
        : field.field_type === 'date'
          ? 'date'
          : 'text';
    control = (
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
    );
  }

  return (
    <label
      htmlFor={id}
      className="flex flex-col text-sm font-medium text-brand-surfaceForeground/80"
    >
      {label}
      {control}
    </label>
  );
}
