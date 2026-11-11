function getWeekdayLabels(locale) {
  // 2024-01-07 a 2024-01-13 e uma semana de referencia Dom..Sab
  const referenceSunday = new Date(2024, 0, 7);
  const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(referenceSunday);
    date.setDate(referenceSunday.getDate() + index);
    const label = formatter.format(date).replace(/\.$/, '');
    return label.charAt(0).toUpperCase() + label.slice(1);
  });
}

function MonthGrid({ days, onSelectDay, locale }) {
  const weekdayLabels = getWeekdayLabels(locale);
  return (
    <div>
      <div className="grid grid-cols-7 gap-1 pb-1 text-center text-xs font-semibold text-brand-surfaceForeground/60">
        {weekdayLabels.map((label, index) => (
          <span key={`${label}-${index}`}>{label}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
      {days.map((day) => (
        <button
          type="button"
          key={day.key}
          onClick={() => onSelectDay(day.key)}
          className={`flex h-16 flex-col items-center justify-start rounded-lg border border-brand-border p-1.5 text-sm transition hover:bg-brand-light/60 sm:h-20 ${
            day.inCurrentMonth ? '' : 'opacity-40'
          } ${day.isToday ? 'border-brand-primary bg-brand-primary/10 font-semibold text-brand-primary' : 'text-brand-surfaceForeground'}`}
        >
          <span>{day.dayNumber}</span>
          {day.dots.length > 0 ? (
            <span className="mt-1 flex flex-wrap justify-center gap-0.5">
              {day.dots.slice(0, 4).map((dot, index) => (
                <span
                  key={`${day.key}-${dot.id}-${index}`}
                  className={`h-1.5 w-1.5 rounded-full ${dot.className}`}
                />
              ))}
            </span>
          ) : null}
        </button>
      ))}
      </div>
    </div>
  );
}

export default MonthGrid;
