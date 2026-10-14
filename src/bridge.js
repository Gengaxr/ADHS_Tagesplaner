const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function decodeTitle(raw) {
  try {
    return decodeURIComponent(raw).trim();
  } catch {
    return raw.trim();
  }
}

function parseOne(part) {
  const bar = part.indexOf('|');
  if (bar < 0) return null;
  const head = part.slice(0, bar).trim();
  const title = decodeTitle(part.slice(bar + 1));
  if (!title) return null;
  if (head.toLowerCase() === 'ganztag') {
    return { title, start: '00:00', end: '23:59', allDay: true };
  }
  const [start, end] = head.split('-');
  if (!TIME.test(start ?? '') || !TIME.test(end ?? '')) return null;
  // Ganztägige Kalendertermine kommen aus Kurzbefehlen als 00:00 bis 23:59 oder 00:00 bis 00:00
  if (start === '00:00' && (end === '23:59' || end === '00:00')) {
    return { title, start: '00:00', end: '23:59', allDay: true };
  }
  return { title, start, end };
}

/** Liest die vom Kurzbefehl übergebenen Termine aus `?events=HH:MM-HH:MM|Titel;...`. */
export function parseEventsParam(search) {
  const value = new URLSearchParams(search).get('events');
  if (!value) return [];
  return value
    .split(';')
    .map(parseOne)
    .filter(Boolean);
}
