const MAX_TASKS = 3;
const FREE_MIN = 90;
const DAY_START = 8 * 60;
const DAY_END = 22 * 60;
const FEIERABEND = 23 * 60;
const NIGHT_END = 4 * 60;
const KIND_ORDER = { anchor: 0, event: 1, task: 2, free: 3, rain: 4, feierabend: 5 };
const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const EMPTY_NOTE = 'Heute ist noch nichts geplant. Das ist okay. Magst du eine Kleinigkeit eintragen?';

const toMin = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
const toHhmm = (min) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
const ceil5 = (min) => Math.ceil(min / 5) * 5;
const overlaps = (a, b) => a.start < b.end && b.start < a.end;

function greetingFor(nowMin, name) {
  const who = name ? `, ${name}` : '';
  if (nowMin >= NIGHT_END && nowMin < 12 * 60) return `Guten Morgen${who}`;
  return `Hallo${who}`;
}

function weatherLineFor(w) {
  if (!w) return null;
  return w.rainFromHour != null ? `${w.tempNow}°, Regen ab ${w.rainFromHour} Uhr` : `${w.tempNow}°, trocken`;
}

/** Macht aus Terminen, Aufgaben, Ankern und Wetter das Morgenbriefing. */
export function buildBriefing({ name, date, now, events, tasks, anchors, weather }) {
  const day = new Date(`${date}T12:00:00`);
  const nowMin = toMin(now);
  const items = [];
  const busy = [];

  for (const a of anchors.filter((x) => x.days.includes(day.getDay()))) {
    const start = toMin(a.time);
    items.push({ kind: 'anchor', start, title: a.title, minutes: a.minutes });
    busy.push({ start, end: start + a.minutes });
  }

  const seen = new Set();
  for (const e of events) {
    const key = `${e.title}|${e.start}|${e.end}|${!!e.allDay}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (e.allDay) {
      items.push({ kind: 'event', start: 0, title: e.title, allDay: true });
    } else {
      const start = toMin(e.start);
      const end = Math.max(toMin(e.end), start);
      items.push({ kind: 'event', start, title: e.title, minutes: end - start });
      busy.push({ start, end });
    }
  }

  const open = tasks.filter((t) => !t.done);
  const earliest = Math.max(ceil5(nowMin), nowMin < NIGHT_END ? DAY_START : 0);
  let moreCount = Math.max(0, open.length - MAX_TASKS);
  for (const t of open.slice(0, MAX_TASKS)) {
    let start = earliest;
    for (let guard = 0; guard < 200; guard++) {
      const clash = busy.find((b) => overlaps({ start, end: start + t.minutes }, b));
      if (!clash) break;
      start = ceil5(clash.end);
    }
    if (start + t.minutes > DAY_END) {
      const lastEnd = busy.reduce((m, b) => Math.max(m, b.end), earliest);
      start = ceil5(lastEnd);
      if (start >= DAY_END) {
        moreCount += 1;
        continue;
      }
    }
    items.push({ kind: 'task', start, title: t.title, minutes: t.minutes });
    busy.push({ start, end: start + t.minutes });
  }

  const sorted = busy.slice().sort((a, b) => a.start - b.start);
  let cursor = Math.max(DAY_START, ceil5(nowMin));
  for (const b of sorted) {
    if (b.start - cursor >= FREE_MIN) {
      items.push({ kind: 'free', start: cursor, title: 'frei, spontan', minutes: b.start - cursor });
    }
    cursor = Math.max(cursor, b.end);
  }
  if (DAY_END - cursor >= FREE_MIN) {
    items.push({ kind: 'free', start: cursor, title: 'frei, spontan', minutes: DAY_END - cursor });
  }

  if (weather?.rainFromHour != null) {
    items.push({ kind: 'rain', start: weather.rainFromHour * 60, title: 'Regen ab hier' });
  }
  if (nowMin >= NIGHT_END && nowMin < FEIERABEND) {
    items.push({ kind: 'feierabend', start: FEIERABEND, title: 'Feierabend-Check' });
  }

  const timeline = items
    .sort((a, b) => a.start - b.start || KIND_ORDER[a.kind] - KIND_ORDER[b.kind])
    .map(({ start, ...rest }) => ({ ...rest, start: toHhmm(start) }));

  const first = open[0];
  const hasPlans = anchors.some((x) => x.days.includes(day.getDay())) || events.length > 0 || open.length > 0;

  return {
    greeting: greetingFor(nowMin, name),
    dateLabel: `${WEEKDAYS[day.getDay()]}, ${day.getDate()}. ${MONTHS[day.getMonth()]}`,
    weatherLine: weatherLineFor(weather),
    timeline,
    firstStep: first
      ? { taskId: first.id, title: first.firstStep ?? first.title, minutes: Math.min(first.minutes, 10) }
      : null,
    moreCount,
    emptyNote: hasPlans ? null : EMPTY_NOTE,
  };
}
