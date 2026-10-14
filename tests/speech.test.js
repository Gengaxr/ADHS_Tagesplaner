import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toSpeechText, pickGermanVoice, speak } from '../src/speech.js';

const briefing = {
  greeting: 'Guten Morgen, Max',
  dateLabel: 'Mi, 14. Okt',
  weatherLine: '14°, Regen ab 16 Uhr',
  timeline: [
    { kind: 'anchor', start: '08:00', title: 'Kaffee bei Eltern', minutes: 20 },
    { kind: 'task', start: '08:20', title: 'Wäsche', minutes: 10 },
    { kind: 'event', start: '11:00', title: 'Zahnarzt', minutes: 60 },
    { kind: 'feierabend', start: '23:00', title: 'Feierabend-Check' },
  ],
  firstStep: { taskId: 't1', title: 'Wäsche', minutes: 10 },
  moreCount: 1,
  emptyNote: null,
};

test('Sprechtext nennt Begrüßung, Wetter, Aufgaben mit Dauer, Termin und ersten Schritt', () => {
  const t = toSpeechText(briefing);
  assert.match(t, /Guten Morgen, Max/);
  assert.match(t, /14 Grad/);
  assert.match(t, /Regen ab 16 Uhr/);
  assert.match(t, /Wäsche, 10 Minuten/);
  assert.match(t, /Zahnarzt/);
  assert.match(t, /11 Uhr/);
  assert.match(t, /Dein erster kleiner Schritt/);
  assert.match(t, /noch 1 weitere/);
});

test('Sprechtext hat kein Ausrufezeichen und keinen senkrechten Strich', () => {
  const t = toSpeechText(briefing);
  assert.equal(t.includes('!'), false);
  assert.equal(t.includes('|'), false);
});

test('bei leerem Tag wird die freundliche Zeile gesprochen', () => {
  const t = toSpeechText({
    ...briefing, timeline: [], firstStep: null, moreCount: 0,
    emptyNote: 'Heute ist noch nichts geplant. Das ist okay. Magst du eine Kleinigkeit eintragen?',
  });
  assert.match(t, /Heute ist noch nichts geplant/);
});

test('ohne Wetter wird keine Wetterzeile gesprochen', () => {
  assert.equal(/Grad/.test(toSpeechText({ ...briefing, weatherLine: null })), false);
});

test('pickGermanVoice bevorzugt Premium, dann Erweitert oder Enhanced, dann irgendeine deutsche', () => {
  const plain = { name: 'Anna', lang: 'de-DE' };
  const enh = { name: 'Anna (Erweitert)', lang: 'de-DE' };
  const prem = { name: 'Anna (Premium)', lang: 'de-DE' };
  const en = { name: 'Samantha (Premium)', lang: 'en-US' };
  assert.equal(pickGermanVoice([en, plain, enh, prem]), prem);
  assert.equal(pickGermanVoice([en, plain, enh]), enh);
  assert.equal(pickGermanVoice([en, { name: 'Max (Enhanced)', lang: 'de_AT' }]).name, 'Max (Enhanced)');
  assert.equal(pickGermanVoice([en, plain]), plain);
  assert.equal(pickGermanVoice([en]), null);
  assert.equal(pickGermanVoice([]), null);
});

test('speak meldet unsupported ohne Sprachausgabe', async () => {
  assert.equal(await speak('Hallo', {}, [], 50), 'unsupported');
  assert.equal(await speak('Hallo', null, [], 50), 'unsupported');
});

test('speak meldet blocked, wenn die Sprachausgabe nie startet', async () => {
  const synth = { cancel() {}, speak() {} };
  globalThis.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };
  assert.equal(await speak('Hallo', synth, [], 50), 'blocked');
});

test('speak meldet started, sobald die Sprachausgabe beginnt', async () => {
  const synth = { cancel() {}, speak(u) { setTimeout(() => u.onstart?.(), 5); } };
  globalThis.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };
  assert.equal(await speak('Hallo', synth, [], 50), 'started');
});

test('pickGermanVoice nimmt die gewünschte Stimme, wenn sie vorhanden ist', () => {
  const a = { name: 'Anna (Premium)', lang: 'de-DE' };
  const b = { name: 'Markus', lang: 'de-DE' };
  assert.equal(pickGermanVoice([a, b], 'Markus'), b);
  assert.equal(pickGermanVoice([a, b], 'Gibt es nicht'), a);
  assert.equal(pickGermanVoice([a, b], ''), a);
});

test('speak nutzt die gewünschte Stimme', async () => {
  let used = null;
  const synth = { cancel() {}, speak(u) { used = u.voice; setTimeout(() => u.onstart?.(), 5); } };
  globalThis.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };
  const voices = [{ name: 'Anna (Premium)', lang: 'de-DE' }, { name: 'Markus', lang: 'de-DE' }];
  await speak('Hallo', synth, voices, 50, 'Markus');
  assert.equal(used.name, 'Markus');
});

test('shortcutSpeakUrl baut die Kurzbefehl-Adresse mit kodiertem Text', async () => {
  const { shortcutSpeakUrl } = await import('../src/speech.js');
  const url = shortcutSpeakUrl('Guten Morgen, Ärger & Co. 100%', 'Briefing vorlesen');
  assert.ok(url.startsWith('shortcuts://run-shortcut?'));
  const q = new URLSearchParams(url.split('?')[1]);
  assert.equal(q.get('name'), 'Briefing vorlesen');
  assert.equal(q.get('input'), 'text');
  assert.equal(q.get('text'), 'Guten Morgen, Ärger & Co. 100%');
});
