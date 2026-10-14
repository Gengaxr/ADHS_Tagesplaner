const WARMUP = { name: 'Aufwärmen: Arm-, Schulter- und Handgelenkkreisen, Hampelmann', sets: 1, target: '3 min', rest: 0 };
const HANDSTAND = 'Wand-Handstand, Brust zur Wand';
const LSIT = 'L-Sit auf Parallettes, Knie angewinkelt';
const SUPPORT = 'Stütz auf Parallettes, Schultern runterdrücken';

/** Einheiten für Philipps Geräte: Klimmzugstange im Türrahmen, Mini-Parallettes, 2 mal 2,5 kg Knöchelgewichte, 2 kg Gewichtsball. Fertigkeiten (Handstand, L-Sit) stehen früh, solange du frisch bist. */
export const DEFAULT_SESSIONS = {
  Push: [
    WARMUP,
    { name: HANDSTAND, sets: 4, target: '15-40 s', rest: 60 },
    { name: 'Liegestütze auf Parallettes', sets: 3, target: '6-12', rest: 90 },
    { name: 'Pike-Liegestütze, Hüfte hoch', sets: 3, target: '5-10', rest: 90 },
    { name: 'Seitheben mit Knöchelgewichten in den Händen', sets: 3, target: '10-15', rest: 60 },
    { name: 'Plank', sets: 3, target: '30-60 s', rest: 60 },
  ],
  Pull: [
    WARMUP,
    { name: 'Klimmzüge an der Türrahmenstange', sets: 3, target: '3-8', rest: 120 },
    { name: 'Rudern an der tief gestellten Stange', sets: 3, target: '6-12', rest: 90 },
    { name: 'Bizeps-Curls mit Knöchelgewichten in den Händen', sets: 3, target: '10-15', rest: 60 },
    { name: SUPPORT, sets: 3, target: '15-30 s', rest: 60 },
    { name: 'Hängendes Beinheben, Knie angewinkelt', sets: 3, target: '5-10', rest: 60 },
  ],
  'Beine und Core': [
    WARMUP,
    { name: LSIT, sets: 4, target: '10-20 s', rest: 60 },
    { name: 'Kniebeugen mit Gewichtsball', sets: 3, target: '10-15', rest: 90 },
    { name: 'Ausfallschritte mit Knöchelgewichten', sets: 3, target: '8-12', rest: 90 },
    { name: 'Einbeinige Glute Bridge', sets: 3, target: '8-12', rest: 60 },
    { name: 'Wadenheben', sets: 3, target: '15-20', rest: 45 },
    { name: 'Russian Twist mit Gewichtsball', sets: 3, target: '16-24', rest: 45 },
  ],
  Ganzkörper: [
    WARMUP,
    { name: HANDSTAND, sets: 3, target: '20-40 s', rest: 60 },
    { name: 'Klimmzüge an der Türrahmenstange', sets: 3, target: '3-8', rest: 120 },
    { name: 'Liegestütze auf Parallettes', sets: 3, target: '6-12', rest: 90 },
    { name: 'Kniebeugen mit Gewichtsball', sets: 3, target: '10-15', rest: 90 },
    { name: 'Rudern an der tief gestellten Stange', sets: 3, target: '6-12', rest: 90 },
    { name: 'Plank', sets: 3, target: '30-60 s', rest: 60 },
  ],
};

/** Nächste Stufe, wenn alle Sätze am oberen Ende des Ziels waren. */
export const NEXT_STAGE = {
  [SUPPORT]: LSIT,
  [LSIT]: 'Einbeiniger L-Sit (ein Bein gestreckt)',
  [HANDSTAND]: 'Handstand mit Rücken zur Wand, kontrolliert hochkicken',
  'Pike-Liegestütze, Hüfte hoch': 'Pike-Liegestütze mit erhöhten Füßen',
  'Liegestütze auf Parallettes': 'Liegestütze mit erhöhten Füßen',
};

const TIPS = {
  [HANDSTAND]: 'Eine Handlänge Abstand zur Wand, Finger gespreizt, Arme gestreckt, Bauch zur Wand und den Körper lang machen. Wärm die Handgelenke vorher auf und steig kontrolliert ab, bevor du wackelst.',
  [LSIT]: 'Knie zur Brust ziehen, Po vom Boden heben, Arme gestreckt, Schultern von den Ohren wegdrücken. Auch ein kurzes Anheben zählt.',
  [SUPPORT]: 'Arme gestreckt, Schultern runterdrücken, Brust raus, Po nah an den Parallettes. Das ist die Grundlage für den L-Sit.',
};

/** Kurzer Hinweis zur Ausführung, falls es einen gibt. */
export const tipFor = (name) => TIPS[name] ?? null;

/** Wochentag (0 = Sonntag) auf Einheit: Montag, Mittwoch, Freitag und Sonntag. */
export const DEFAULT_DAYS = { 1: 'Push', 3: 'Pull', 5: 'Beine und Core', 0: 'Ganzkörper' };

const UNITS = { '': 'Wdh', s: 'Sek', min: 'Min' };

/** Liest Ziele wie "6-12", "30-60 s" oder "3 min": untere und obere Grenze sowie Einheit. */
export function targetInfo(target) {
  const m = /^(\d+)(?:-(\d+))?\s*(s|min)?$/i.exec(String(target).trim());
  if (!m) return null;
  const low = Number(m[1]);
  return { low, high: m[2] ? Number(m[2]) : low, unit: UNITS[(m[3] ?? '').toLowerCase()] };
}

/** Eine Übung pro Zeile: "Name | Sätze | Ziel | Pause in Sekunden". Ungültige Zeilen entfallen. */
export function parseExercises(text) {
  const out = [];
  for (const line of String(text ?? '').split('\n')) {
    const [name, sets, target, rest] = line.split('|').map((x) => x?.trim());
    const n = Number(sets);
    if (!name || !Number.isInteger(n) || n < 1 || !target || !targetInfo(target)) continue;
    const r = Number(rest);
    out.push({
      name,
      sets: Math.min(n, 10),
      target,
      rest: Number.isFinite(r) && rest !== undefined && rest !== '' ? Math.min(600, Math.max(0, Math.round(r))) : 60,
    });
  }
  return out;
}

export const formatExercises = (list) => list.map((e) => `${e.name} | ${e.sets} | ${e.target} | ${e.rest}`).join('\n');

export const sessionForDay = (weekday, days = DEFAULT_DAYS) => days[weekday] ?? null;

export function startWorkout(name, exercises, nowMs) {
  return { name, exercises, startedAt: nowMs, exIndex: 0, setIndex: 0, results: exercises.map(() => []), restEndsAt: null, finished: false };
}

export const isFinished = (w) => w.finished;
export const currentExercise = (w) => (w.finished ? null : w.exercises[w.exIndex] ?? null);

/** Trägt das Ergebnis eines Satzes ein und geht zum nächsten Satz oder zur nächsten Übung, jeweils mit Pause. */
export function completeSet(w, value, nowMs) {
  const ex = currentExercise(w);
  if (!ex) return w;
  const results = w.results.map((r, i) => (i === w.exIndex ? [...r, value] : r));
  const restEndsAt = ex.rest > 0 ? nowMs + ex.rest * 1000 : null;
  if (w.setIndex + 1 < ex.sets) return { ...w, results, setIndex: w.setIndex + 1, restEndsAt };
  const exIndex = w.exIndex + 1;
  if (exIndex >= w.exercises.length) return { ...w, results, exIndex, setIndex: 0, restEndsAt: null, finished: true };
  return { ...w, results, exIndex, setIndex: 0, restEndsAt };
}

export const skipRest = (w) => ({ ...w, restEndsAt: null });
export const restLeftMs = (w, nowMs) => (w.restEndsAt ? Math.max(0, w.restEndsAt - nowMs) : 0);

/** Hinweis für das nächste Mal, abhängig davon, wie die Sätze lagen. */
export function progressHint(ex, sets) {
  const info = targetInfo(ex.target);
  if (!info || info.unit === 'Min') return '';
  if (sets.length >= ex.sets && sets.every((v) => v >= info.high)) {
    const next = NEXT_STAGE[ex.name];
    if (next) return `Alle Sätze am oberen Ende. Nächste Stufe: ${next}.`;
    return 'Alle Sätze am oberen Ende. Nächstes Mal schwerer: mehr Gewicht, langsameres Tempo oder eine schwerere Variante.';
  }
  if (sets.some((v) => v < info.low)) return 'Ein Satz war unter dem Ziel. Bleib bei dieser Stufe und mach sauber weiter.';
  return '';
}

export function logEntry(w, date) {
  return {
    date,
    session: w.name,
    exercises: w.exercises.map((e, i) => ({ name: e.name, target: e.target, sets: w.results[i] })),
  };
}

/** Sätze der letzten Einheit mit gleichem Namen für diese Übung, sonst null. */
export function lastResult(log, session, exerciseName) {
  for (let i = log.length - 1; i >= 0; i--) {
    if (log[i].session !== session) continue;
    const ex = log[i].exercises.find((e) => e.name === exerciseName);
    if (ex) return ex.sets;
  }
  return null;
}

/** Zusammenfassung mit Ergebnis, letztem Mal und Hinweis je Übung. */
export function workoutSummary(w, log, nowMs) {
  const lines = w.exercises.map((e, i) => ({
    name: e.name,
    target: e.target,
    sets: w.results[i],
    last: lastResult(log, w.name, e.name),
    hint: progressHint(e, w.results[i]),
  }));
  return { lines, minutes: Math.max(0, Math.round((nowMs - w.startedAt) / 60000)) };
}
