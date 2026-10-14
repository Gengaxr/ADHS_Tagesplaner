import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildBriefing } from '../src/briefing.js';

const DATE = '2026-10-14'; // Mittwoch
const task = (id, title, minutes, extra = {}) => ({ id, title, minutes, done: false, date: DATE, ...extra });
const kaffee = { id: 'a1', title: 'Kaffee bei Eltern', time: '08:00', minutes: 20, days: [0, 1, 2, 3, 4, 5, 6] };
const base = { name: 'Max', date: DATE, now: '08:05', events: [], tasks: [], anchors: [], weather: null };

test('normaler Tag: Reihenfolge, erster Schritt, Wetterzeile, Feierabend zuletzt', () => {
  const b = buildBriefing({
    ...base,
    anchors: [kaffee],
    events: [{ title: 'Zahnarzt', start: '11:00', end: '12:00' }],
    tasks: [task('t1', 'Wäsche', 10), task('t2', 'Müll raus', 5), task('t3', 'Spülmaschine', 10)],
    weather: { tempNow: 14, rainFromHour: 16, dryUntilHour: 16 },
  });
  assert.equal(b.greeting, 'Guten Morgen, Max');
  assert.equal(b.dateLabel, 'Mi, 14. Okt');
  assert.equal(b.weatherLine, '14°, Regen ab 16 Uhr');
  assert.deepEqual(b.timeline.map((i) => i.kind), [
    'anchor', 'task', 'task', 'task', 'free', 'event', 'free', 'rain', 'feierabend',
  ]);
  assert.deepEqual(b.timeline.map((i) => i.start), [
    '08:00', '08:20', '08:30', '08:35', '08:45', '11:00', '12:00', '16:00', '23:00',
  ]);
  assert.deepEqual(b.firstStep, { taskId: 't1', title: 'Wäsche', minutes: 10 });
  assert.equal(b.moreCount, 0);
  assert.equal(b.emptyNote, null);
  assert.equal(b.timeline.at(-1).title, 'Feierabend-Check');
});

test('vier offene Aufgaben: drei im Tagesband, eine als "weitere"', () => {
  const b = buildBriefing({
    ...base,
    tasks: [task('t1', 'a', 5), task('t2', 'b', 5), task('t3', 'c', 5), task('t4', 'd', 5)],
  });
  assert.equal(b.timeline.filter((i) => i.kind === 'task').length, 3);
  assert.equal(b.moreCount, 1);
});

test('erledigte Aufgaben tauchen nicht auf', () => {
  const b = buildBriefing({ ...base, tasks: [task('t1', 'fertig', 5, { done: true }), task('t2', 'offen', 5)] });
  assert.deepEqual(b.timeline.filter((i) => i.kind === 'task').map((i) => i.title), ['offen']);
  assert.equal(b.firstStep.taskId, 't2');
});

test('leerer Tag: freundliche Zeile, kein erster Schritt, Feierabend bleibt', () => {
  const b = buildBriefing(base);
  assert.equal(b.emptyNote, 'Heute ist noch nichts geplant. Das ist okay. Magst du eine Kleinigkeit eintragen?');
  assert.equal(b.firstStep, null);
  assert.equal(b.timeline.at(-1).kind, 'feierabend');
});

test('ganztägiger Termin und doppelte Termine erscheinen nur einmal, der Anker bleibt', () => {
  const lunch = { title: 'Toni', start: '09:00', end: '10:00' };
  const b = buildBriefing({
    ...base,
    anchors: [kaffee],
    events: [{ title: 'Geburtstag', start: '00:00', end: '23:59', allDay: true }, lunch, { ...lunch }],
  });
  assert.equal(b.timeline.filter((i) => i.title === 'Toni').length, 1);
  assert.equal(b.timeline.filter((i) => i.title === 'Geburtstag').length, 1);
  assert.equal(b.timeline.filter((i) => i.kind === 'anchor').length, 1);
  assert.equal(b.timeline[0].title, 'Geburtstag');
});

test('Anker erscheinen nur an ihren Wochentagen', () => {
  const montag = { id: 'a2', title: 'Training Push', time: '11:00', minutes: 45, days: [1] };
  const b = buildBriefing({ ...base, anchors: [montag] });
  assert.equal(b.timeline.filter((i) => i.kind === 'anchor').length, 0);
});

test('Aufgabe mit 600 Minuten: kein Absturz, erster Schritt höchstens 10 Minuten', () => {
  const b = buildBriefing({ ...base, tasks: [task('t1', 'Keller ausmisten', 600)] });
  assert.equal(b.firstStep.minutes, 10);
  assert.ok(b.timeline.length >= 1);
});

test('Aufgaben überlappen keine Termine', () => {
  const b = buildBriefing({
    ...base,
    now: '08:00',
    events: [{ title: 'Arzt', start: '08:00', end: '09:00' }],
    tasks: [task('t1', 'Wäsche', 10)],
  });
  const t = b.timeline.find((i) => i.kind === 'task');
  assert.equal(t.start, '09:00');
});

test('nach Mitternacht (00:30): kein Absturz, kein Feierabend als bevorstehend', () => {
  const b = buildBriefing({ ...base, now: '00:30', tasks: [task('t1', 'Wäsche', 10)] });
  assert.equal(b.timeline.some((i) => i.kind === 'feierabend'), false);
  assert.equal(b.greeting, 'Hallo, Max');
});

test('ohne Wetter: keine Wetterzeile, sonst vollständig', () => {
  const b = buildBriefing({ ...base, anchors: [kaffee], weather: null });
  assert.equal(b.weatherLine, null);
  assert.ok(b.timeline.length > 0);
});

test('trockener Tag: Wetterzeile ohne Regenzeit und kein Regen-Marker', () => {
  const b = buildBriefing({ ...base, weather: { tempNow: 12, rainFromHour: null, dryUntilHour: null } });
  assert.equal(b.weatherLine, '12°, trocken');
  assert.equal(b.timeline.some((i) => i.kind === 'rain'), false);
});

test('kein Text im Briefing enthält ein Ausrufezeichen', () => {
  const b = buildBriefing({ ...base, anchors: [kaffee], tasks: [task('t1', 'Wäsche', 10)] });
  const all = JSON.stringify(b);
  assert.equal(all.includes('!'), false);
});

test('ohne Namen lautet die Begrüßung nur "Guten Morgen"', () => {
  assert.equal(buildBriefing({ ...base, name: '' }).greeting, 'Guten Morgen');
  assert.equal(buildBriefing({ ...base, name: undefined, now: '14:00' }).greeting, 'Hallo');
});
