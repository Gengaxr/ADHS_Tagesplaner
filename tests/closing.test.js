import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildClosing, isFeierabendTime } from '../src/closing.js';

const TODAY = '2026-10-14'; // Mittwoch
const TOMORROW = '2026-10-15'; // Donnerstag
const task = (id, title, done, date = TODAY, minutes = 10) => ({ id, title, minutes, done, date });
const training = { id: 'a1', title: 'Training Pull', time: '11:00', minutes: 45, days: [4] };
const kaffee = { id: 'a2', title: 'Kaffee bei Eltern', time: '08:00', minutes: 20, days: [0, 1, 2, 3, 4, 5, 6] };

test('trennt Geschafftes von Offenem und zählt', () => {
  const c = buildClosing({
    date: TODAY, tomorrow: TOMORROW,
    tasks: [task('1', 'Wäsche', true), task('2', 'Müll', false), task('3', 'Bad', true)],
    anchors: [],
  });
  assert.deepEqual(c.doneToday.map((t) => t.title), ['Wäsche', 'Bad']);
  assert.deepEqual(c.openToday.map((t) => t.title), ['Müll']);
  assert.equal(c.summary, 'Heute geschafft: 2');
});

test('ohne erledigte Aufgaben kommt ein freundlicher Satz statt Null', () => {
  const c = buildClosing({ date: TODAY, tomorrow: TOMORROW, tasks: [task('1', 'Müll', false)], anchors: [] });
  assert.equal(c.summary, 'Heute war ein ruhiger Tag. Das ist okay.');
});

test('Aufgaben und Anker von morgen: nur die passenden Wochentage, nach Uhrzeit sortiert', () => {
  const c = buildClosing({
    date: TODAY, tomorrow: TOMORROW,
    tasks: [task('1', 'Heute', false), task('2', 'Morgen', false, TOMORROW)],
    anchors: [kaffee, training, { id: 'a3', title: 'Nur Montag', time: '09:00', minutes: 30, days: [1] }],
  });
  assert.deepEqual(c.tomorrowTasks.map((t) => t.title), ['Morgen']);
  assert.deepEqual(c.tomorrowAnchors.map((a) => a.title), ['Kaffee bei Eltern', 'Training Pull']);
});

test('leerer Tag: keine Fehler, alles leer', () => {
  const c = buildClosing({ date: TODAY, tomorrow: TOMORROW, tasks: [], anchors: [] });
  assert.deepEqual([c.doneToday, c.openToday, c.tomorrowTasks, c.tomorrowAnchors], [[], [], [], []]);
  assert.equal(c.summary.includes('!'), false);
});

test('kein Text enthält ein Ausrufezeichen', () => {
  const c = buildClosing({ date: TODAY, tomorrow: TOMORROW, tasks: [task('1', 'a', true)], anchors: [] });
  assert.equal(JSON.stringify(c).includes('!'), false);
});

test('isFeierabendTime gilt ab 23 Uhr bis kurz vor 4 Uhr', () => {
  assert.equal(isFeierabendTime('22:59'), false);
  assert.equal(isFeierabendTime('23:00'), true);
  assert.equal(isFeierabendTime('00:30'), true);
  assert.equal(isFeierabendTime('03:59'), true);
  assert.equal(isFeierabendTime('04:00'), false);
  assert.equal(isFeierabendTime('14:00'), false);
});
