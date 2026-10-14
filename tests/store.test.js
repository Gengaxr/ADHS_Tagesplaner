import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../src/store.js';

function memoryStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
}

test('Aufgabe speichern und nach Neuladen wieder lesen', () => {
  const storage = memoryStorage();
  const a = createStore(storage);
  const t = a.addTask({ title: 'Wäsche', minutes: 10, date: '2026-10-14' });
  const b = createStore(storage);
  assert.deepEqual(b.getTasks('2026-10-14'), [t]);
  assert.equal(t.done, false);
});

test('getTasks filtert nach Datum', () => {
  const s = createStore(memoryStorage());
  s.addTask({ title: 'heute', minutes: 5, date: '2026-10-14' });
  s.addTask({ title: 'morgen', minutes: 5, date: '2026-10-15' });
  assert.deepEqual(s.getTasks('2026-10-15').map((t) => t.title), ['morgen']);
});

test('setDone und removeTask', () => {
  const s = createStore(memoryStorage());
  const t = s.addTask({ title: 'Müll', minutes: 5, date: '2026-10-14' });
  s.setDone(t.id, true);
  assert.equal(s.getTasks('2026-10-14')[0].done, true);
  s.removeTask(t.id);
  assert.deepEqual(s.getTasks('2026-10-14'), []);
});

test('Anker speichern und entfernen', () => {
  const s = createStore(memoryStorage());
  const a = s.addAnchor({ title: 'Training Push', time: '11:00', minutes: 45, days: [1, 3, 5] });
  assert.deepEqual(s.getAnchors(), [a]);
  s.removeAnchor(a.id);
  assert.deepEqual(s.getAnchors(), []);
});

test('exportJson enthält Aufgaben und Anker und ist lesbar', () => {
  const s = createStore(memoryStorage());
  s.addTask({ title: 'Wäsche', minutes: 10, date: '2026-10-14' });
  s.addAnchor({ title: 'Kaffee', time: '08:00', minutes: 20, days: [0, 1, 2, 3, 4, 5, 6] });
  const data = JSON.parse(s.exportJson());
  assert.equal(data.tasks.length, 1);
  assert.equal(data.anchors.length, 1);
});

test('ohne Speicher oder bei werfendem Speicher läuft die App im Arbeitsspeicher weiter', () => {
  for (const storage of [
    null,
    { getItem: () => { throw new Error('x'); }, setItem: () => { throw new Error('x'); } },
  ]) {
    const s = createStore(storage);
    const t = s.addTask({ title: 'Test', minutes: 5, date: '2026-10-14' });
    assert.deepEqual(s.getTasks('2026-10-14'), [t]);
  }
});

test('kaputte gespeicherte Daten werden ignoriert', () => {
  const storage = memoryStorage();
  storage.setItem('planer.v1', '{kaputt');
  assert.deepEqual(createStore(storage).getTasks('2026-10-14'), []);
});
