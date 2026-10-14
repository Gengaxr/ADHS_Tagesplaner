import { test } from 'node:test';
import assert from 'node:assert/strict';
import { suggestSplit, parseZones, formatZones, DEFAULT_ROOMS } from '../src/split.js';

test('Wohnzimmer aufräumen wird in Zonen zerlegt, jede Zone höchstens 10 Minuten', () => {
  const s = suggestSplit('Wohnzimmer aufräumen');
  assert.equal(s.name, 'Wohnzimmer');
  assert.equal(s.generic, false);
  assert.ok(s.zones.length >= 4);
  assert.ok(s.zones.every((z) => z.title && z.minutes >= 1 && z.minutes <= 10));
  assert.ok(s.zones.some((z) => /Couch/.test(z.title)));
  assert.ok(s.zones.some((z) => /Schreibtisch/.test(z.title)));
});

test('Schlafzimmer und Kleiderstangen führen zur selben Vorlage', () => {
  assert.equal(suggestSplit('Schlafzimmer aufräumen').name, 'Schlafzimmer');
  assert.equal(suggestSplit('Kleiderstangen sortieren').name, 'Schlafzimmer');
  assert.ok(suggestSplit('Schlafzimmer aufräumen').zones.some((z) => /Kleiderstange/.test(z.title)));
});

test('Bad und Badezimmer, Groß- und Kleinschreibung egal, aber nicht mitten im Wort', () => {
  assert.equal(suggestSplit('BAD putzen').name, 'Bad');
  assert.equal(suggestSplit('badezimmer sauber machen').name, 'Bad');
  assert.equal(suggestSplit('Verband wechseln').generic, true);
});

test('unbekannte Aufgabe bekommt eine einfache Aufteilung in drei Schritte', () => {
  const s = suggestSplit('Garage sortieren');
  assert.equal(s.generic, true);
  assert.equal(s.zones.length, 3);
  assert.ok(s.zones.every((z) => z.title.startsWith('Garage sortieren')));
  assert.ok(s.zones.every((z) => z.minutes <= 10));
});

test('eigene Zonen ersetzen die Standardzonen', () => {
  const custom = { Wohnzimmer: [{ title: 'Nur die Couch', minutes: 7 }] };
  const s = suggestSplit('Wohnzimmer aufräumen', custom);
  assert.deepEqual(s.zones, [{ title: 'Nur die Couch', minutes: 7 }]);
});

test('leere oder leerzeichenartige Eingabe ergibt keine Zerlegung', () => {
  assert.equal(suggestSplit('   '), null);
  assert.equal(suggestSplit(''), null);
});

test('parseZones liest "Titel | Minuten" zeilenweise und formatZones kehrt es um', () => {
  const z = parseZones('Couch freiräumen | 10\nSchreibtisch\n\n  Boden | 5  \nKaputt | abc\nZu lang | 500');
  assert.deepEqual(z, [
    { title: 'Couch freiräumen', minutes: 10 },
    { title: 'Schreibtisch', minutes: 10 },
    { title: 'Boden', minutes: 5 },
    { title: 'Kaputt', minutes: 10 },
    { title: 'Zu lang', minutes: 10 },
  ]);
  assert.equal(formatZones([{ title: 'Boden', minutes: 5 }]), 'Boden | 5');
});

test('Standardräume sind Wohnzimmer, Schlafzimmer, Bad und ohne Ausrufezeichen', () => {
  assert.deepEqual(Object.keys(DEFAULT_ROOMS), ['Wohnzimmer', 'Schlafzimmer', 'Bad']);
  assert.equal(JSON.stringify(DEFAULT_ROOMS).includes('!'), false);
});

test('Standardzonen enthalten keinen Doppelpunkt, damit "Raum: Zone" lesbar bleibt', () => {
  for (const zones of Object.values(DEFAULT_ROOMS)) {
    assert.ok(zones.every((z) => !z.title.includes(':')));
  }
});
