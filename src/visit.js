const MIN = 60000;

/** Reihenfolge, wenn Besuch kommt: zuerst Couch, Boden und Sideboard, dann Rest von Wohnzimmer und Bad. */
export const DEFAULT_VISIT_STEPS = [
  { title: 'Wohnzimmer: Couch ordnen, Decken und Kissen', minutes: 5 },
  { title: 'Wohnzimmer: Boden freiräumen, Dinge wegbringen', minutes: 5 },
  { title: 'Wohnzimmer: Sideboard mit TV freiräumen und abwischen', minutes: 5 },
  { title: 'Bad: Waschbecken und Spiegel abwischen', minutes: 5 },
  { title: 'Bad: Toilette reinigen', minutes: 5 },
  { title: 'Wohnzimmer: Müll und Geschirr einsammeln', minutes: 5 },
  { title: 'Wohnzimmer: Couchtisch freiräumen', minutes: 5 },
  { title: 'Bad: Handtücher wechseln', minutes: 5 },
  { title: 'Bad: Boden wischen', minutes: 5 },
  { title: 'Wohnzimmer: Schreibtisch aufräumen', minutes: 10 },
];

export function startVisit(nowMs, minutes, steps = DEFAULT_VISIT_STEPS) {
  return { startedAt: nowMs, endsAt: nowMs + minutes * MIN, steps, index: 0, done: [], skipped: [] };
}

export const currentStep = (v) => v.steps[v.index] ?? null;

export function completeStep(v) {
  const step = currentStep(v);
  if (!step) return v;
  return { ...v, done: [...v.done, step], index: v.index + 1 };
}

export function skipStep(v) {
  const step = currentStep(v);
  if (!step) return v;
  return { ...v, skipped: [...v.skipped, step], index: v.index + 1 };
}

export const msLeft = (v, nowMs) => Math.max(0, v.endsAt - nowMs);

/** Zusammenfassung für den Schluss: was geschafft ist, was noch offen bleibt, wie lange es gedauert hat. */
export function visitSummary(v, nowMs) {
  const doneTitles = v.done.map((s) => s.title);
  const remainingTitles = [...v.skipped, ...v.steps.slice(v.index)].map((s) => s.title);
  const minutesUsed = Math.max(0, Math.round((Math.min(nowMs, v.endsAt) - v.startedAt) / MIN));
  const n = doneTitles.length;
  const text = n > 0
    ? `Geschafft: ${n} ${n === 1 ? 'Schritt' : 'Schritte'} in ${minutesUsed} Minuten`
    : 'Diesmal kein Schritt geschafft. Das ist okay.';
  return { doneTitles, doneCount: n, remainingTitles, minutesUsed, text };
}

/** Wie viele Schritte hintereinander in die Zeit passen, mindestens einer (null bei leerer Liste). */
export function fitCount(steps, minutes) {
  if (!steps.length) return 0;
  let used = 0;
  let n = 0;
  for (const s of steps) {
    if (used + s.minutes > minutes) break;
    used += s.minutes;
    n += 1;
  }
  return Math.max(1, n);
}

/** Minuten, für die es einen fertigen Kurzbefehl "Besuch-Timer N" gibt. */
export const TIMER_MINUTES = [10, 20, 30, 45, 60];

/** Adresse, die den Kurzbefehl "Besuch-Timer N" startet und danach zur Seite zurückkehrt; null ohne passenden Kurzbefehl. */
export function shortcutTimerUrl(minutes, returnUrl) {
  if (!TIMER_MINUTES.includes(minutes)) return null;
  const q = new URLSearchParams({ name: `Besuch-Timer ${minutes}`, 'x-success': returnUrl });
  return `shortcuts://x-callback-url/run-shortcut?${q.toString().replace(/\+/g, '%20')}`;
}
