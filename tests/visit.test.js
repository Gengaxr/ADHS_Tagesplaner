import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_VISIT_STEPS, startVisit, currentStep, completeStep, skipStep, msLeft, visitSummary, fitCount, shortcutTimerUrl, TIMER_MINUTES,
} from '../src/visit.js';

const MIN = 60000;
const steps = [
  { title: 'Couch', minutes: 5 },
  { title: 'Boden', minutes: 5 },
  { title: 'Sideboard', minutes: 10 },
];

test('Standardschritte beginnen mit Couch, Boden, Sideboard mit TV und enthalten Wohnzimmer und Bad', () => {
  const t = DEFAULT_VISIT_STEPS.map((s) => s.title);
  assert.match(t[0], /Couch/);
  assert.match(t[1], /Boden/);
  assert.match(t[2], /Sideboard/);
  assert.ok(t.some((x) => /^Bad/.test(x)));
  assert.ok(DEFAULT_VISIT_STEPS.every((s) => s.minutes >= 1 && s.minutes <= 10));
  assert.equal(JSON.stringify(DEFAULT_VISIT_STEPS).includes('!'), false);
});

test('startVisit setzt Ende und ersten Schritt', () => {
  const v = startVisit(1000, 20, steps);
  assert.equal(v.endsAt, 1000 + 20 * MIN);
  assert.deepEqual(currentStep(v), steps[0]);
  assert.equal(msLeft(v, 1000), 20 * MIN);
  assert.equal(msLeft(v, 1000 + 25 * MIN), 0);
});

test('completeStep und skipStep gehen weiter, ohne das Original zu verändern', () => {
  const v0 = startVisit(0, 20, steps);
  const v1 = completeStep(v0);
  assert.deepEqual(currentStep(v1), steps[1]);
  assert.deepEqual(v1.done, [steps[0]]);
  assert.equal(v0.done.length, 0);
  const v2 = skipStep(v1);
  assert.deepEqual(currentStep(v2), steps[2]);
  assert.deepEqual(v2.skipped, [steps[1]]);
  const v3 = completeStep(v2);
  assert.equal(currentStep(v3), null);
  assert.equal(currentStep(completeStep(v3)), null);
});

test('visitSummary: geschafft, verbleibend und genutzte Minuten', () => {
  let v = startVisit(0, 20, steps);
  v = completeStep(v);
  v = completeStep(v);
  const s = visitSummary(v, 12 * MIN);
  assert.deepEqual(s.doneTitles, ['Couch', 'Boden']);
  assert.deepEqual(s.remainingTitles, ['Sideboard']);
  assert.equal(s.minutesUsed, 12);
  assert.equal(s.text, 'Geschafft: 2 Schritte in 12 Minuten');
});

test('visitSummary: Einzahl, nach Ablauf zählt nur die Zeit bis zum Ende, ohne Schritte ein ruhiger Satz', () => {
  const one = completeStep(startVisit(0, 10, steps));
  assert.equal(visitSummary(one, 30 * MIN).text, 'Geschafft: 1 Schritt in 10 Minuten');
  const none = visitSummary(startVisit(0, 10, steps), 3 * MIN);
  assert.equal(none.text, 'Diesmal kein Schritt geschafft. Das ist okay.');
  assert.equal(none.text.includes('!'), false);
});

test('fitCount zählt, wie viele Schritte in die Zeit passen, mindestens einer', () => {
  assert.equal(fitCount(steps, 20), 3);
  assert.equal(fitCount(steps, 10), 2);
  assert.equal(fitCount(steps, 4), 1);
  assert.equal(fitCount([], 20), 0);
});

test('shortcutTimerUrl startet den Kurzbefehl "Besuch-Timer N" und kehrt zur Seite zurück', () => {
  const url = shortcutTimerUrl(20, 'https://example.github.io/app/');
  assert.ok(url.startsWith('shortcuts://x-callback-url/run-shortcut?'));
  const q = new URLSearchParams(url.split('?')[1]);
  assert.equal(q.get('name'), 'Besuch-Timer 20');
  assert.equal(q.get('x-success'), 'https://example.github.io/app/');
  assert.equal(url.includes('+'), false);
});

test('shortcutTimerUrl gibt null zurück, wenn es keinen Kurzbefehl für die Minuten gibt', () => {
  assert.equal(shortcutTimerUrl(25, 'https://example.github.io/app/'), null);
  assert.deepEqual(TIMER_MINUTES, [10, 20, 30, 45, 60]);
});
