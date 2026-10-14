import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseEventsParam } from '../src/bridge.js';

test('liest zwei Termine mit Titel, Start und Ende', () => {
  assert.deepEqual(parseEventsParam('?events=09:00-10:30|Zahnarzt;14:00-15:00|Toni'), [
    { title: 'Zahnarzt', start: '09:00', end: '10:30' },
    { title: 'Toni', start: '14:00', end: '15:00' },
  ]);
});

test('behält Sonderzeichen und Trennzeichen im Titel, wenn sie kodiert sind', () => {
  const raw = '11:00-12:00|Mama %3B Papa | Kaffee ☕ Ä';
  const ev = parseEventsParam('?events=' + encodeURIComponent(raw));
  assert.equal(ev.length, 1);
  assert.equal(ev[0].title, 'Mama ; Papa | Kaffee ☕ Ä');
});

test('ganztägige Termine bekommen allDay und den ganzen Tag', () => {
  assert.deepEqual(parseEventsParam('?events=ganztag|Geburtstag'), [
    { title: 'Geburtstag', start: '00:00', end: '23:59', allDay: true },
  ]);
});

test('leere oder kaputte Eingabe ergibt eine leere Liste', () => {
  assert.deepEqual(parseEventsParam(''), []);
  assert.deepEqual(parseEventsParam('?events='), []);
  assert.deepEqual(parseEventsParam('?events=xx'), []);
  assert.deepEqual(parseEventsParam('?events=25:99-26:00|Quatsch'), []);
});
