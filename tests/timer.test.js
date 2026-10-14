import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTimer, remainingMs, formatMmSs } from '../src/timer.js';

test('ein 5-Minuten-Timer hat sofort 300000 ms übrig', () => {
  assert.equal(remainingMs(createTimer(5, 1000), 1000), 300000);
});

test('nach Ablauf bleibt 0 übrig, nie negativ', () => {
  assert.equal(remainingMs(createTimer(5, 1000), 1000 + 301000), 0);
});

test('formatMmSs zeigt Minuten und Sekunden mit führender Null', () => {
  assert.equal(formatMmSs(300000), '05:00');
  assert.equal(formatMmSs(61000), '01:01');
  assert.equal(formatMmSs(0), '00:00');
  assert.equal(formatMmSs(-5), '00:00');
});
