import { layoutOverlappingEvents, computeBlockRect } from '../../../utils/calendarGrid';

const PX_PER_HOUR = 64;

function formatHourLabel(minutes) {
  const hours = Math.floor(minutes / 60);
  return `${String(hours).padStart(2, '0')}:00`;
}

function HourGrid({
  rangeStartMinutes,
  rangeEndMinutes,
  columns,
  renderEvent,
  onEventClick,
}) {
  const totalMinutes = rangeEndMinutes - rangeStartMinutes;
  const bodyHeight = (totalMinutes / 60) * PX_PER_HOUR;
  const hourMarks = [];
  for (let m = rangeStartMinutes; m < rangeEndMinutes; m += 60) {
    hourMarks.push(m);
  }

  return (
    <div className="overflow-x-auto">
      <div
        className="grid"
        style={{ gridTemplateColumns: `56px repeat(${columns.length}, minmax(140px, 1fr))` }}
      >
        <div />
        {columns.map((column) => (
          <div
            key={column.key}
            className="border-l border-brand-border px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-brand-surfaceForeground/60"
          >
            {column.label}
          </div>
        ))}
      </div>

      <div
        className="grid"
        style={{ gridTemplateColumns: `56px repeat(${columns.length}, minmax(140px, 1fr))` }}
      >
        <div className="relative" style={{ height: bodyHeight }}>
          {hourMarks.map((minutes) => (
            <div
              key={minutes}
              className="absolute left-0 right-0 -translate-y-1/2 text-[11px] text-brand-surfaceForeground/50"
              style={{ top: `${((minutes - rangeStartMinutes) / totalMinutes) * 100}%` }}
            >
              {formatHourLabel(minutes)}
            </div>
          ))}
        </div>

        {columns.map((column) => {
          const positioned = layoutOverlappingEvents(column.events);
          return (
            <div
              key={column.key}
              className="relative border-l border-brand-border"
              style={{ height: bodyHeight }}
            >
              {hourMarks.map((minutes) => (
                <div
                  key={minutes}
                  className="absolute left-0 right-0 border-t border-brand-border/60"
                  style={{ top: `${((minutes - rangeStartMinutes) / totalMinutes) * 100}%` }}
                />
              ))}
              {positioned.map((event) => {
                const rect = computeBlockRect({
                  startMinutes: event.startMinutes,
                  endMinutes: event.endMinutes,
                  rangeStartMinutes,
                  rangeEndMinutes,
                  column: event.column,
                  columnCount: event.columnCount,
                });
                return (
                  <button
                    type="button"
                    key={event.id}
                    onClick={() => onEventClick?.(event.raw)}
                    className="absolute overflow-hidden rounded-lg px-1.5 py-0.5 text-left text-xs leading-tight shadow-sm"
                    style={{
                      top: rect.top,
                      height: rect.height,
                      left: rect.left,
                      width: rect.width,
                    }}
                  >
                    {renderEvent(event)}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default HourGrid;
