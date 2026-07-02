const FALLBACK_RANGE = { startMinutes: 9 * 60, endMinutes: 18 * 60 };

export function parseTimeToMinutes(value) {
  if (typeof value !== 'string') return null;
  const match = value.match(/^(\d{2}):(\d{2})/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

export function getBusinessHoursRangeMinutes(businessHours) {
  if (!Array.isArray(businessHours) || businessHours.length === 0) {
    return { ...FALLBACK_RANGE };
  }

  let startMinutes = null;
  let endMinutes = null;

  businessHours
    .filter((item) => item?.is_active)
    .forEach((item) => {
      const start = parseTimeToMinutes(item.start_time);
      const end = parseTimeToMinutes(item.end_time);
      if (start == null || end == null) return;
      if (startMinutes == null || start < startMinutes) startMinutes = start;
      if (endMinutes == null || end > endMinutes) endMinutes = end;
    });

  if (startMinutes == null || endMinutes == null || startMinutes >= endMinutes) {
    return { ...FALLBACK_RANGE };
  }

  return { startMinutes, endMinutes };
}

export function minutesSinceMidnight(date) {
  return date.getHours() * 60 + date.getMinutes();
}

export function layoutOverlappingEvents(events) {
  const sorted = [...events].sort(
    (a, b) => a.startMinutes - b.startMinutes || a.endMinutes - b.endMinutes
  );

  const results = [];
  let cluster = [];
  let clusterEnd = -Infinity;

  const flushCluster = () => {
    if (cluster.length === 0) return;
    const columnEnds = [];
    const startIndex = results.length;

    cluster.forEach((event) => {
      let columnIndex = columnEnds.findIndex((end) => end <= event.startMinutes);
      if (columnIndex === -1) {
        columnIndex = columnEnds.length;
        columnEnds.push(event.endMinutes);
      } else {
        columnEnds[columnIndex] = event.endMinutes;
      }
      results.push({ ...event, column: columnIndex });
    });

    const columnCount = columnEnds.length;
    for (let i = startIndex; i < results.length; i += 1) {
      results[i] = { ...results[i], columnCount };
    }

    cluster = [];
  };

  sorted.forEach((event) => {
    if (cluster.length > 0 && event.startMinutes >= clusterEnd) {
      flushCluster();
      clusterEnd = -Infinity;
    }
    cluster.push(event);
    clusterEnd = Math.max(clusterEnd, event.endMinutes);
  });
  flushCluster();

  return results;
}

export function computeBlockRect({
  startMinutes,
  endMinutes,
  rangeStartMinutes,
  rangeEndMinutes,
  column,
  columnCount,
}) {
  const totalRange = rangeEndMinutes - rangeStartMinutes;
  const clampedStart = Math.max(startMinutes, rangeStartMinutes);
  const clampedEnd = Math.min(endMinutes, rangeEndMinutes);
  const top = ((clampedStart - rangeStartMinutes) / totalRange) * 100;
  const height = Math.max(((clampedEnd - clampedStart) / totalRange) * 100, 0);
  const width = 100 / columnCount;
  const left = width * column;

  return {
    top: `${top}%`,
    height: `${height}%`,
    left: `${left}%`,
    width: `${width}%`,
  };
}
