import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SESSIONS, DEFAULT_DAYS, parseExercises, formatExercises, targetInfo, sessionForDay,
  startWorkout, currentExercise, isFinished, completeSet, skipRest, restLeftMs,
  progressHint, workoutSummary, logEntry, lastResult,
} from '../src/training.js';

const EX = [
  { name: 'Liegestütze', sets: 2, target: '6-12', rest: 90 },
  { name: 'Plank', sets: 1, target: '30-60 s', rest: 0 },
];

test('Standardplan: Montag, Mittwoch, Freitag, Sonntag, nur Geräte, die Philipp hat', () => {
  assert.deepEqual(Object.keys(DEFAULT_DAYS).map(Number).sort(), [0, 1, 3, 5]);
  assert.equal(DEFAULT_DAYS[1], 'Push');
  assert.equal(DEFAULT_DAYS[3], 'Pull');
  for (const name of Object.values(DEFAULT_DAYS)) {
    const ex = DEFAULT_SESSIONS[name];
    assert.ok(ex.length >= 5, name);
    assert.match(ex[0].name, /Aufwärmen/);
    assert.ok(ex.every((e) => e.sets >= 1 && e.rest >= 0 && targetInfo(e.target).high >= targetInfo(e.target).low), name);
  }
  const all = JSON.stringify(DEFAULT_SESSIONS);
  assert.equal(all.includes('!'), false);
  assert.match(all, /Klimmzüge/);
  assert.match(all, /Parallettes/);
  assert.match(all, /Knöchelgewichte/);
  assert.match(all, /Gewichtsball/);
});

test('targetInfo liest Bereich und Einheit', () => {
  assert.deepEqual(targetInfo('6-12'), { low: 6, high: 12, unit: 'Wdh' });
  assert.deepEqual(targetInfo('30-60 s'), { low: 30, high: 60, unit: 'Sek' });
  assert.deepEqual(targetInfo('3 min'), { low: 3, high: 3, unit: 'Min' });
  assert.deepEqual(targetInfo('10'), { low: 10, high: 10, unit: 'Wdh' });
});

test('parseExercises und formatExercises sind zueinander umkehrbar, kaputte Zeilen werden ignoriert', () => {
  const text = 'Liegestütze | 3 | 6-12 | 90\nPlank | 2 | 30-60 s\n\nKaputt\nZu viele | 99 | 5 | 10';
  const list = parseExercises(text);
  assert.deepEqual(list, [
    { name: 'Liegestütze', sets: 3, target: '6-12', rest: 90 },
    { name: 'Plank', sets: 2, target: '30-60 s', rest: 60 },
    { name: 'Zu viele', sets: 10, target: '5', rest: 10 },
  ]);
  assert.deepEqual(parseExercises(formatExercises(list)), list);
});

test('sessionForDay nutzt die Zuordnung, sonst null', () => {
  assert.equal(sessionForDay(1), 'Push');
  assert.equal(sessionForDay(2), null);
  assert.equal(sessionForDay(2, { 2: 'Pull' }), 'Pull');
});

test('Workout läuft Satz für Satz mit Pause und endet nach der letzten Übung', () => {
  let w = startWorkout('Push', EX, 0);
  assert.equal(currentExercise(w).name, 'Liegestütze');
  assert.equal(w.setIndex, 0);
  assert.equal(restLeftMs(w, 0), 0);

  w = completeSet(w, 10, 1000);
  assert.equal(w.setIndex, 1);
  assert.equal(currentExercise(w).name, 'Liegestütze');
  assert.equal(restLeftMs(w, 1000), 90000);
  assert.equal(restLeftMs(w, 1000 + 100000), 0);
  w = skipRest(w);
  assert.equal(restLeftMs(w, 2000), 0);

  w = completeSet(w, 8, 5000);
  assert.equal(currentExercise(w).name, 'Plank');
  assert.equal(w.setIndex, 0);
  assert.equal(isFinished(w), false);

  w = completeSet(w, 45, 9000);
  assert.equal(isFinished(w), true);
  assert.equal(currentExercise(w), null);
  assert.deepEqual(w.results, [[10, 8], [45]]);
  assert.deepEqual(completeSet(w, 5, 10000).results, w.results);
});

test('Original bleibt unverändert', () => {
  const w0 = startWorkout('Push', EX, 0);
  completeSet(w0, 10, 1);
  assert.deepEqual(w0.results, [[], []]);
});

test('progressHint: oberes Ende, Ziel verfehlt, sonst leer', () => {
  const ex = { name: 'Liegestütze', sets: 3, target: '6-12', rest: 90 };
  assert.match(progressHint(ex, [12, 12, 13]), /schwerer/);
  assert.match(progressHint(ex, [10, 5, 8]), /unter dem Ziel/);
  assert.equal(progressHint(ex, [8, 8, 9]), '');
  assert.equal(progressHint({ name: 'Aufwärmen', sets: 1, target: '3 min', rest: 0 }, [3]), '');
  assert.equal(progressHint(ex, [12, 12]).includes('schwerer'), false);
  assert.equal(progressHint(ex, [12, 12, 12]).includes('!'), false);
});

test('logEntry, lastResult und workoutSummary vergleichen mit dem letzten Mal', () => {
  let w = startWorkout('Push', EX, 0);
  w = completeSet(w, 10, 1);
  w = completeSet(w, 8, 2);
  w = completeSet(w, 45, 3);
  const entry = logEntry(w, '2026-10-12');
  assert.deepEqual(entry, {
    date: '2026-10-12', session: 'Push',
    exercises: [
      { name: 'Liegestütze', target: '6-12', sets: [10, 8] },
      { name: 'Plank', target: '30-60 s', sets: [45] },
    ],
  });
  assert.deepEqual(lastResult([entry], 'Push', 'Liegestütze'), [10, 8]);
  assert.equal(lastResult([entry], 'Pull', 'Liegestütze'), null);
  assert.equal(lastResult([], 'Push', 'Liegestütze'), null);

  const sum = workoutSummary(w, [entry], 25 * 60000);
  assert.equal(sum.minutes, 25);
  assert.deepEqual(sum.lines[0].sets, [10, 8]);
  assert.deepEqual(sum.lines[0].last, [10, 8]);
});
