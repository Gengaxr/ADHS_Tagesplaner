const NIGHT_START = 23 * 60;
const NIGHT_END = 4 * 60;

const toMin = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

/** Ab 23 Uhr bis kurz vor 4 Uhr ist Zeit für den Feierabend-Check. */
export function isFeierabendTime(now) {
  const m = toMin(now);
  return m >= NIGHT_START || m < NIGHT_END;
}

/** Fasst den Tag für den Feierabend-Check zusammen und zeigt, was morgen ansteht. */
export function buildClosing({ date, tomorrow, tasks, anchors }) {
  const today = tasks.filter((t) => t.date === date);
  const doneToday = today.filter((t) => t.done);
  const openToday = today.filter((t) => !t.done);
  const weekday = new Date(`${tomorrow}T12:00:00`).getDay();
  const tomorrowAnchors = anchors
    .filter((a) => a.days.includes(weekday))
    .sort((a, b) => a.time.localeCompare(b.time));
  return {
    doneToday,
    openToday,
    tomorrowTasks: tasks.filter((t) => t.date === tomorrow),
    tomorrowAnchors,
    summary: doneToday.length > 0 ? `Heute geschafft: ${doneToday.length}` : 'Heute war ein ruhiger Tag. Das ist okay.',
  };
}
